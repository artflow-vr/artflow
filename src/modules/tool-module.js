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

class ToolModule {

    constructor() {

        // Contains every tool: brush, water, etc...
        // These tools are not instanciated, they represent only a blueprint.
        this._tools = {};
        this._instance = {};

        // Contains the tool for each controller. Whenever the user is not in VR,
        // only one tool is accessible at a time.
        this._selected = new Array( 2 );

        // General tools should be accessible every time, even if they are not
        // currently selected.
        this._generalTools = [];

        this.undoStack = [];
        this.redoStack = [];

        this.objectPool = null;

    }

    register( toolID, tool ) {

        if ( toolID in this._tools ) {
            let errorMsg = 'you already registered the tool \'' + toolID +
                '\'';
            throw Error( 'ToolModule: ' + errorMsg );
        }

        this._tools[ toolID ] = tool;

        // Adds the tool to the UI if a texture was provided.
        if ( tool.uiTexture ) {
            UI.addTool( toolID, tool.uiTexture,
                AssetManager.assets.texture[ 'ui-button-back' ],
                this._onUISelection.bind( this )
            );
        }

    }

    init( isVR ) {

        this.objectPool = new Utils.ObjectPool();
        this._registerBasicTools();

        // TODO: This is gross and this is a bug of the UI.
        // It should be OK to refresh each time an element is added but
        // it does not seem to work.
        UI._homeUIs[ 0 ].refresh();

        this._selected[ 0 ] = this._instance.Brush[ 0 ];
        this._selected[ 1 ] = this._instance.Brush[ 1 ];

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

        let tool = null;
        for ( let toolID in this._instance ) {
            tool = this._instance[ toolID ];
            if ( tool.update ) tool.update( data );
        }

    }

    _onColorChange( color ) {

        for ( let e in this._instance ) {
            this._instance[ e ][ 0 ].triggerEvent( 'colorChanged', color );
            this._instance[ e ][ 1 ].triggerEvent( 'colorChanged', color );
        }

    }

    _onUISelection( toolID, controllerID, evt ) {

        if ( evt.pressed )
            this._selected[ controllerID ] = this._instance[ toolID ][ controllerID ];

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

    _instanciate( toolID, options ) {

        if ( !( toolID in this._tools ) ) {
            let errorMsg = 'Tool \'' + toolID + '\' is not registered yet.';
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

    _registerBasicTools( isVR ) {

        this.register( 'Teleporter', {
            Tool: Tool.TeleporterTool
        } );
        this.register( 'Brush', {
            uiTexture: AssetManager.assets.texture[ 'ui-tool-brush' ],
            Tool: Tool.BrushTool
        } );
        this.register( 'Particle', {
            uiTexture: AssetManager.assets.texture[ 'ui-tool-particles' ],
            Tool: Tool.ParticleTool
        } );
        this.register( 'Water', {
            uiTexture: AssetManager.assets.texture[ 'ui-tool-water' ],
            Tool: Tool.WaterTool
        } );
        this.register( 'Tree', {
            uiTexture: AssetManager.assets.texture[ 'ui-tool-tree' ],
            Tool: Tool.TreeTool
        } );


        this._instanciate( 'Brush', isVR );
        this._instanciate( 'Water' );
        this._instanciate( 'Tree', Tool.TreeTool.registeredBrushes[ 1 ] );
        this._instanciate( 'Particle' );

    }

}

export default new ToolModule();
