/**
 * ArtFlow application
 * https://github.com/artflow-vr/artflow
 *
 * MIT License
 *
 * Copyright (c) 2017 artflow
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as Tool from './tool/tool';
import * as Utils from '../utils/utils';

import MainView from '../view/main-view';
import UI from '../view/ui';

let AssetManager = Utils.AssetManager;
let EventDispatcher = Utils.EventDispatcher;

import ParticleShader from '../shader/particle/particle-shader';
import ParticleShader2 from '../shader/particle/particle-shader2';
import ParticleHelix from '../shader/particle/particle-helix';
import PositionUpdate from '../shader/particle/position-update';
import PositionHelix from '../shader/particle/position-helix';
import VelocityUpdate from '../shader/particle/velocity-update';

const BASE_TOOL= 'Brush';

class ToolModule {

    constructor() {

        // Contains every tool: brush, water, etc...
        // These tools are not instanciated, they represent only a blueprint.
        this._tools = {};
        this._instance = {};

        // Contains a reference to an array containing the controllers.
        // The reference is global and should not be messed up.
        this._controllers = null;

        // Contains the tool for each controller. Whenever the user is not in VR,
        // only one tool is accessible at a time.
        this._selected = new Array( 2 );

        // General tools should be accessible every time, even if they are not
        // currently selected.
        this._generalTools = [];

        this.undoStack = [];
        this.redoStack = [];

    }

    /**
     * Registers a new tool template that will be instancied by the ArtFlow
     * engine.
     *
     * @param {string} toolID - string used to map the tool.
     * @param {Object} tool - Object containing the tool associated UI texture,
     * as well as the tool prototype. The texture should be a THREE.Texture.
     * e.g:
     *
     *  {
     *      uiTexture: AssetManager.assets.texture[ 'ui-tool-brush' ],
     *      Tool: Tool.BrushTool
     *  }
     *
     */
    register( toolID, tool ) {

        if ( toolID in this._tools ) {
            let errorMsg = 'you already registered the tool \'' + toolID +
                '\'';
            throw Error( 'ToolModule: register(): ' + errorMsg );
        }

        this._tools[ toolID ] = tool;

        // Sets the name of the preview to find it more easily.
        if ( tool.preview ) {
            let prev = tool.preview;
            prev.name = 'preview';
            prev.position.z -= 0.07;
            prev.scale.set( 0.01, 0.01, 0.01 );

            tool.previews = new Array( 2 );
            tool.previews[ 0 ] = prev.clone();
            tool.previews[ 1 ] = prev.clone();
        }

        // Adds the tool to the UI if a texture was provided.
        if ( !tool.uiTexture ) return;

        UI.addTool( { id: toolID, data: tool },
            AssetManager.assets.texture.ui[ 'button-back' ],
            this._onUISelection.bind( this )
        );

    }

    /**
     * Registers a new tool item template that will be instancied by the tool
     * itself according to its needs.
     *
     * @param {string} toolID - id of the tool to which the item belong.
     * @param {Object} item - Object containing the item associated UI texture,
     * as well as the item data. The data is a simple JavaScript Object that
     * the tool will use in its own manner.
     * e.g:
     *
     *  {
     *      uiTexture: AssetManager.assets.texture[ 'ui-brush-leaves' ],
     *      item: {
     *         size: 1.0,
     *         ...
     *      }
     *  }
     *
     */
    registerToolItem( toolID, itemID, item ) {

        let tool = this._tools[ toolID ];
        if ( !tool ) {
            let warnMsg = 'trying to register an item for non existing \'';
            warnMsg += toolID + '\' tool.';
            console.warn( 'ToolModule: registerToolItem(): ' + warnMsg );
            return;
        }

        tool = tool.Tool;

        // The items object is not yet created, we build it.
        if ( !tool.items )
            tool.items = {};
        else if ( itemID in tool.items ) {
            let warnMsg = 'trying to register an already-register item for ';
            warnMsg += 'tool \'' + toolID + '\'';
            console.warn( 'ToolModule: registerToolItem(): ' + warnMsg );
            return;
        }

        tool.items[ itemID ] = item;

        // Adds the tool to the UI if a texture was provided.
        if ( !item.uiTexture ) return;

        let buttonBackground = AssetManager.assets.texture.ui[ 'button-back' ];
        UI.addToolItem(
            toolID, { id: itemID, data: item },
            buttonBackground, this._onItemSelection.bind( this )
        );

    }

    /**
     * Register several items by using an items map. This function is a wrapper
     * above the `registerToolItem' method.
     *
     * @param {string} toolID - id of the tool to which the items belong.
     * @param {Object} items - Map in which each key represent an item, and
     * where the key value is a JavaScript object containing the item associated
     * UI texture, as well as the item data.
     * e.g:
     *  {
     *      leaves: {
     *          uiTexture: AssetManager.assets.texture[ 'ui-brush-leaves' ],
     *          item: {
     *              size: 1.0,
     *              ...
     *          }
     *      },
     *      ...
     *  }
     */
    registerToolItems( toolID, items ) {

        for ( let itemID in items )
            this.registerToolItem( toolID, itemID, items[ itemID ] );

    }

    instanciate( toolID, options ) {

        if ( !( toolID in this._tools ) ) {
            let errorMsg = 'Tool \'' + toolID + '\' is not registered yet.';
            throw Error( 'ToolModule._instanciate(): ' + errorMsg );
        }

        if ( this._instance[ toolID ] ) {
            let errorMsg = 'Tool \'' + toolID + '\' is already instancied. ';
            errorMsg += 'You can only have at most 2 instances.';
            throw Error( 'ToolModule._instanciate(): ' + errorMsg );
        }

        // The user can use two tool at the same time. We need two instances
        // of each.
        let instance = new Array( 2 );
        instance[ 0 ] = new this._tools[ toolID ].Tool( options );
        instance[ 1 ] = new this._tools[ toolID ].Tool( options );
        this._instance[ toolID ] = instance;

        // Adds tool's view groups to the root scene and the moving group.
        MainView.addToMovingGroup( instance[ 0 ].worldGroup.getObject() );
        MainView.addToMovingGroup( instance[ 1 ].worldGroup.getObject() );
        MainView.addToScene( instance[ 0 ].localGroup.getObject() );
        MainView.addToScene( instance[ 1 ].localGroup.getObject() );

    }

    init( ) {

        this._registerBasicTools();
        this._registerBasicItems();

        this.instanciate( 'Brush', {
            isVR: true
        } );
        this.instanciate( 'Particle' );
        this.instanciate( 'Water' );
        this.instanciate( 'Tree' );

        this._selected[ 0 ] = this._instance[ BASE_TOOL ][ 0 ];
        this._selected[ 1 ] = this._instance[ BASE_TOOL ][ 1 ];

        // TODO: Add onEnterChild & onExitChild event trigger.

        /*
            The Code below registers every supported events, such as the
            Vive and mouse button, color changes, UI selection...
        */

        // Registers events sent by the UI
        EventDispatcher.register( 'colorChange', this._onColorChange.bind( this ) );

        // Registers input events, coming either from the Vive, or from
        // the mouse.
        EventDispatcher.registerFamily(
            'interact', this._getEventFamily( 'interact' ), 1
        );
        EventDispatcher.registerFamily(
            'axisChanged', this._getEventFamily( 'axisChanged' ), 1
        );

        // Registers 'redo' and 'undo' events that can be trigger by
        // the input, or from the UI.
        EventDispatcher.register( 'undo', () => {

            if ( this.undoStack.length === 0 ) return;

            let cmd = this.undoStack.pop();
            cmd.undo();
            this.redoStack.push( cmd );

        } );

        EventDispatcher.register( 'redo', () => {

            if ( this.redoStack.length === 0 ) return;

            let cmd = this.redoStack.pop();
            cmd.redo();
            this.undoStack.push( cmd );

        } );

        // For efficiency reason, we will register particular events for general
        // tools, it will allow them to be accessible every time.
        // TODO: Look at the parameter 'general' when registering a tool, in
        // order to avoid hardcode this registering.
        let teleporter = new Tool.TeleporterTool();
        MainView.addToMovingGroup( teleporter.worldGroup.getObject() );
        MainView.addToScene( teleporter.localGroup.getObject() );

        this._generalTools.push( teleporter );

        for ( let toolID in this._generalTools ) {
            let tool = this._generalTools[ toolID ];
            for ( let eventID in tool.listenTo ) {
                EventDispatcher.registerFamily(
                    eventID, tool.listenTo[ eventID ], 1
                );
            }
        }

    }

    update( data ) {

        let instances = null;
        for ( let toolID in this._instance ) {
            instances = this._instance[ toolID ];
            instances[ 0 ]._update( data );
            instances[ 1 ]._update( data );
        }

    }

    setControllerRef( controllers ) {

        this._controllers = controllers;
        // Adds preview above each controller.
        this._changeControllerPreview( 0, BASE_TOOL );
        this._changeControllerPreview( 1, BASE_TOOL );
    }

    _onColorChange( color ) {

        for ( let e in this._instance ) {
            this._instance[ e ][ 0 ].triggerEvent( 'colorChanged', color );
            this._instance[ e ][ 1 ].triggerEvent( 'colorChanged', color );
        }

    }

    _onUISelection( toolID, controllerID, evt ) {

        if ( !evt.pressed ) return;

        this._selected[ controllerID ] = this._instance[ toolID ][ controllerID ];
        // TODO: handle onExit.
        this._selected[ controllerID ]._onEnter();

        //
        // Handles Tool preview
        //
        this._changeControllerPreview( controllerID, toolID );

    }

    _onItemSelection( itemID, controllerID, evt ) {

        if ( !evt.pressed ) return;

        this._selected[ controllerID ]._onItemChanged( itemID );

    }

    _getEventFamily( eventID ) {

        return {
            use: ( data ) => {

                this._selected[ data.controllerID ].triggerEvent(
                    eventID, data, 'use'
                );

            },
            trigger: ( data ) => {
                let cmd = this._selected[ data.controllerID ].triggerEvent(
                    eventID, data, 'trigger'
                );
                if ( cmd ) this.undoStack.push( cmd );

                for ( let i = this.redoStack.length - 1; i >= 0; --i ) {
                    let c = this.redoStack.pop();
                    if ( c.clear ) c.clear();
                }
            },
            release: ( data ) => {

                this._selected[ data.controllerID ].triggerEvent(
                    eventID, data, 'release'
                );

            }
        };

    }


    /**
     * Changes the 3D model displayed on a given controller.
     *
     * @memberof ToolModule
     */
    _changeControllerPreview( controllerID, toolID ) {

        if ( this._controllers === null ||
            controllerID >= ( this._controllers.filter( () => true ).length ) )
            return;


        let controller = this._controllers[ controllerID ];

        // Removes previous preview.
        for ( let i = controller.children.length - 1; i >= 0; i-- ) {
            if ( controller.children[ i ].name === 'preview' ) {
                controller.remove( controller.children[ i ] );
                break;
            }
        }

        // Adds new preview
        let preview = this._tools[ toolID ].previews[ controllerID ];
        if ( preview ) controller.add( preview );

    }

    _registerBasicTools() {

        this.register( 'Teleporter', {
            Tool: Tool.TeleporterTool
        } );
        this.register( 'Brush', {
            uiTexture: AssetManager.assets.texture.ui.tool[ 'brush-icon' ],
            preview: AssetManager.assets.model.tool.brush_preview,
            Tool: Tool.BrushTool
        } );
        this.register( 'Particle', {
            uiTexture: AssetManager.assets.texture.ui.tool[ 'particles-icon' ],
            preview: AssetManager.assets.model.tool.particle_preview,
            Tool: Tool.ParticleTool
        } );
        this.register( 'Water', {
            uiTexture: AssetManager.assets.texture.ui.tool[ 'water-icon' ],
            preview: AssetManager.assets.model.tool.water_preview,
            Tool: Tool.WaterTool
        } );
        this.register( 'Tree', {
            uiTexture: AssetManager.assets.texture.ui.tool[ 'tree-icon' ],
            preview: AssetManager.assets.model.tool.tree_preview,
            Tool: Tool.TreeTool
        } );

    }

    _registerBasicItems() {

        let itemsTextures = AssetManager.assets.texture.ui.item;
        let toolTextures = AssetManager.assets.texture.tool;

        //
        // PARTICLES
        //
        this.registerToolItem( 'Particle', 'snow', {
            uiTexture: AssetManager.assets.texture.ui.item[ 'snow-item' ],
            data: {
                brushSize: 3,
                thickness: 10,
                initialParticlesPerEmitter: 20 * 20,
                maxParticlesPerEmitter: 20 * 20,
                bufferSide: 20,
                maxEmitters: 20,
                debugPlane: false,
                positionInitialTex: () => {
                    return THREE.ImageUtils.generateRandomDataTexture( 20, 20 );
                },
                velocityInitialTex: () => {
                    return THREE.ImageUtils.generateDataTexture( 20, 20, new THREE.Color( 0.5, 0.495, 0.5 ) );
                },
                renderingUniforms: {
                    pointMaxSize: { type: 'f', value: 200 },
                    brushSize: { type: 'f', value: 3 } },
                positionUniforms: {
                    normVelocity: { type:'f', value: 10.0 },
                    lifespanEntropy: { type:'f', value: 0.001 }
                },
                renderingShader: ParticleShader,
                positionUpdate: PositionUpdate,
                velocityUpdate: VelocityUpdate
            }
        } );
        this.registerToolItem( 'Particle', 'spiral', {
            uiTexture: AssetManager.assets.texture[ 'spiral-item' ],
            data: {
                brushSize: 3,
                thickness: 10,
                initialParticlesPerEmitter: 20,
                maxParticlesPerEmitter: 20 * 20,
                bufferSide: 20,
                maxEmitters: 20,
                debugPlane: false,
                positionInitialTex: () => {
                    return THREE.ImageUtils.generateRandomDataTexture( 20, 20 );
                },
                velocityInitialTex: () => {
                    return THREE.ImageUtils.generateDataTexture( 20, 20, new THREE.Color( 0.5, 0.495, 0.5 ) );
                },
                renderingUniforms: {
                    pointMaxSize: { type: 'f', value: 20 },
                    brushSize: { type: 'f', value: 3 },
                    rotation: { type:'3f', value: [180.0 * Math.PI / 180.0, 0 / 180.0, 0 / 180.0] }
                },
                positionUniforms: {
                    normVelocity: { type:'f', value: 10.0 },
                    lifespanEntropy: { type:'f', value: 0.001 },
                    a: { type:'f', value: 1.0 },
                    b: { type:'f', value: 1.0 }
                },
                renderingShader: ParticleHelix,
                positionUpdate: PositionHelix,
                velocityUpdate: VelocityUpdate
            }
        } );
        this.registerToolItem( 'Particle', 'confetti', {
            uiTexture: AssetManager.assets.texture[ 'confetti-item' ],
            data: {
                brushSize: 3,
                thickness: 10,
                initialParticlesPerEmitter: 20,
                maxParticlesPerEmitter: 20 * 20,
                bufferSide: 20,
                maxEmitters: 20,
                debugPlane: false,
                positionInitialTex: () => {
                    return THREE.ImageUtils.generateRandomDataTexture( 20, 20 );
                },
                velocityInitialTex: () => {
                    return THREE.ImageUtils.generateRandomDataTexture( 20, 20 );
                },
                renderingUniforms: {
                    pointMaxSize: { type: 'f', value: 20 },
                    brushSize: { type: 'f', value: 3 }
                },
                positionUniforms: {
                    normVelocity: { type:'f', value: 10.0 },
                    lifespanEntropy: { type:'f', value: 0.001 }
                },
                renderingShader: ParticleShader2,
                positionUpdate: PositionUpdate,
                velocityUpdate: VelocityUpdate
            }
        } );

        //

        this.registerToolItems( 'Brush', {
            brushBasic: {
                uiTexture: itemsTextures[ 'brush-basic' ],
                data: { 'static': true }
            },
            brushUnified: {
                uiTexture: itemsTextures[ 'brush-unified' ],
                data: {
                    'static': true,
                    'texture': toolTextures.brush1,
                    'normal': toolTextures.brush1_N
                }
            },
            waveAnim: {
                uiTexture: itemsTextures[ 'brush-wave' ],
                data: { shaderPath: 'wave-shader' }
            },
            rainbowAnim: {
                uiTexture: itemsTextures[ 'brush-rainbow' ],
                data: { shaderPath: 'rainbow-shader', timeModCondition: 3 }
            },
            electricAnim: {
                uiTexture: itemsTextures[ 'brush-lightning' ],
                data: { shaderPath: 'electric-shader', thicknessMult: 2.0 }
            },
            squareAnim: {
                uiTexture: itemsTextures[ 'brush-square' ],
                data: { shaderPath: 'squares-shader', timeMod: 100, timeOffset: 0.5 }
            },
            matrixAnim: {
                uiTexture: itemsTextures[ 'brush-matrix' ],
                data: { shaderPath: 'matrix-shader' }
            },
            fractalAnim: {
                uiTexture: itemsTextures[ 'brush-fractal' ],
                data: { shaderPath: 'fractal-shader' }
            },
            starsAnim: {
                uiTexture: itemsTextures[ 'brush-stars' ],
                data: { shaderPath: 'stars-shader' }
            },
            blueAnim: {
                uiTexture: itemsTextures[ 'brush-blue' ],
                data: { shaderPath: 'blue-shader' }
            },
            crypticAnim: {
                uiTexture: itemsTextures[ 'brush-void' ],
                data: { shaderPath: 'cryptic-shader' }
            },
            hyperGreenAnim: {
                uiTexture: itemsTextures[ 'brush-spiral' ],
                data: { shaderPath: 'hypergreen-shader' }
            },
            rastaAnim: {
                uiTexture: itemsTextures[ 'brush-trippy-rasta' ],
                data: { shaderPath: 'rasta-shader' }
            },
            trippyRastaAnim: {
                uiTexture: itemsTextures[ 'brush-trippy-rasta' ],
                data: { shaderPath: 'trippy-rasta-shader' }
            },
            voronoiAnim: {
                uiTexture: itemsTextures[ 'brush-confettis  ' ],
                data: { shaderPath: 'voronoi-shader' }
            }
        } );

        //
        // TREE
        //
        this.registerToolItems( 'Tree', {
            bush: {
                uiTexture: AssetManager.assets.texture.ui.item[ 'tree-bush' ],
                data: 'bush'
            },
            hilbertCube: {
                uiTexture: AssetManager.assets.texture.ui.item[ 'tree-cube' ],
                data: 'hilbertCube'
            },
            contextSensitive: {
                uiTexture: AssetManager.assets.texture.ui.item[ 'tree-contextSens' ],
                data: 'contextSensitive'
            },
            simpleTree: {
                uiTexture: AssetManager.assets.texture.ui.item[ 'tree-simple' ],
                data: 'simpleTree'
            },
            tiltTree: {
                uiTexture: AssetManager.assets.texture.ui.item[ 'tree-tilt' ],
                data: 'tiltTree'
            }
        } );

    }

}

export default new ToolModule();
