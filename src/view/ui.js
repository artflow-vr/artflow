import VRUI from 'vr-ui';

import EventDispatcher from '../utils/event-dispatcher';

const INIT_POINTER_LEN = 3.5;
const GUI_WIDTH = 0.4; // In Three.js units.
const GUI_HEIGHT = 0.4; // In Three.js units

const GRID_ID = 'elementGrid';
const TOOL_GRID_SIZE = { columns: 4, rows: 3 };
const ITEMS_GRID_SIZE = { columns: 4, rows: 4 };

let setPointerVisibility = ( element, visibility ) => {
    let child = null;
    for ( let i = 0; i < element.children.length; ++i ) {
        child = element.children[ i ];
        if ( child.name === 'pointer' ) child.visible = visibility;
    }
};

class UI {

    constructor() {

        // Contains all the textures used in the UI. This is initialized
        // when calling the `init()' method.
        this._textures = null;

        // Contains all the UI's:
        //  * Home: contains the tools
        //  * Color: contains the color wheel
        //  * Items: contains the VRUI *for each* tool
        this._ui = {
            'default': {
                home: null,
                color: null
            },
            'items': {}
        };

        // This variable allows us to know if *any* of all the UI
        // is targeted by the cursor.
        // This is really important to stop event propagation.
        this._hoverAnyUI = false;

        this._show = false;
        this._pagesGroup = new THREE.Group();
        this._pagesGroup.name = 'ui';

        this._prevController = null;
        this._controllers = null;

        // Cache reference toward each line making the pointer mesh.
        // This allows to avoid retrieving them at each update.
        this._lineMeshes = new Array( 2 );
        this._tipMeshes = new Array( 2 );

        this._hoverContainer = null;
        this._hoverCursor = null;

        this._vr = false;

        // Cache refrences to data extracted from the UI.
        // This alow to avoid instanciating temporary values, that are often
        // discarded.
        this._hsv = { h : 0.0, s : 0.0, v : 0.5 };

    }

    init( textures, controllers, camera, renderer ) {

        // Checks whether or all the textures have been provided or not.
        // We warn the user if some textures are missing.
        let expectedTex = [
            'background', 'arrowLeft', 'buttonBackground', 'buttonHover'
        ];
        for ( let elt of expectedTex ) {
            if ( !textures[ elt ] ) {
                let warnMsg = 'no `' + elt + '\' texture provided.';
                console.warn( 'UI.createToolsUI(): ' + warnMsg );
            }
        }

        this._textures = textures;
        this.triggerShow = this._triggerShowNOVR;

        this._hoverCursor = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ),
            new THREE.MeshBasicMaterial( {
                color: 0xFFFFFF,
                opacity: 1.0,
                transparent: true,
                map: textures.buttonHover,
                visible: false
            } )
        );

        ////
        // Creates the multiple UI (tools, items, color)
        ////

        let homeTemplate = this._createPageTemplate( TOOL_GRID_SIZE );
        // Home UI containing the multiple tools.
        this._ui.default.home = new VRUI.VRUI( {
            width: GUI_WIDTH,
            height: GUI_HEIGHT,
            mode: {
                template: homeTemplate
            }
        }, homeTemplate );
        this._ui.default.home.pageGroup.position.z = -0.2;
        this._ui.default.home.pageGroup.position.y = 0.5;
        this._pagesGroup.add( this._ui.default.home.pageGroup );

        // Color UI.
        this._ui.default.color = new VRUI.VRUI( { width: GUI_WIDTH, height: GUI_HEIGHT } );
        this._ui.default.color.addPage( this._createColorTemplate() );
        this._ui.default.color.pageGroup.rotation.y = - Math.PI / 2.0;
        this._ui.default.color.pageGroup.position.x = 0.25;
        this._ui.default.color.pageGroup.position.z = -0.2;
        this._ui.default.color.pageGroup.position.y = 0.5;
        this._ui.default.color.refresh();
        this._pagesGroup.add( this._ui.default.color.pageGroup );

        this._vr = controllers !== undefined && controllers !== null;
        if ( this._vr ) {
            this._initControllers( controllers );
            this.triggerShow = this._triggerShowVR;
            return;
        }

        // If we are not in VR, we will hack to position the UI in the world,
        // close to the origin. This is nice just to see how ArtFlow works,
        // and does not provide a good experience.
        this._pagesGroup.position.x = 0.0;
        this._pagesGroup.position.y = 2.0;
        this._pagesGroup.position.z = 0.0;
        this._traverseUI( ( ui ) => {

            ui.pages[ 0 ].setVisible( true );
            ui.enableMouse( camera, renderer );

        } );

    }

    update() {

        this._traverseUI( ( ui ) => {

            ui.update();

        } );

    }

    addTool( tool, toolBackground, callback ) {

        let toolID = tool.id;
        let toolTexture = tool.data.uiTexture;

        if ( !toolTexture ) {
            let warnMsg = 'provided texture is undefined.';
            console.warn( 'UI.addTool(): ' + warnMsg );
            return;
        }

        let homeGUI = this._ui.default.home;
        if ( !homeGUI ) {
            let warnMsg = 'you have to create a UI before using addTool';
            console.warn( 'UI.addTool(): ' + warnMsg );
            return;
        }

        // Creates the button representing the element.
        let button = new VRUI.view.ImageButton( {
            innerMaterial: toolTexture
        }, {
            height: 0.7,
            aspectRatio: 1.0,
            padding: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 },
            background: toolBackground
        } );
        button.userData.id = toolID;
        button.onHoverEnter( this._buttonHoverEnter.bind( this ) )
            .onHoverExit( this._buttonHoverExit.bind( this ) )
            .onChange( ( object, evt ) => {

                let controllerID = ( this._prevController + 1 ) % 2;
                callback( toolID, controllerID, evt );

            } );

        homeGUI.add( button, GRID_ID );
        homeGUI.refresh();

    }

    isHoverUI() {

        return this._hoverAnyUI;

    }

    setPressed( trigger ) {

        this._traverseUI( ( ui ) => {

            ui.setPressed( trigger );

        } );

    }

    /*
        The `_triggerShowNOVR()` and `_triggerShowVR()` method are bound
        when calling the `init()` method.
        It avoids checking each time which method to call, whether we are in
        VR or not.
    */

    _triggerShowNOVR() {

        this._show = !this._show;
        this._pagesGroup.traverse ( function ( child ) {

            if ( child instanceof THREE.Mesh ) child.visible = this._show;

        } );

    }

    _triggerShowVR( controllerID ) {

        // Re-displays the UI, and reactivate the input with the opposite
        // controller.
        let nextController = ( controllerID + 1 ) % 2;

        setPointerVisibility( this._controllers[ 0 ], false );
        setPointerVisibility( this._controllers[ 1 ], false );

        this._show = !this._show;

        // Shows/Hides all UIs by simply showing/hidding the group.
        this._pagesGroup.traverse ( function ( child ) {

            if ( child instanceof THREE.Mesh ) child.visible = this._show;

        } );

        // Enables/Disables each UI.
        this._traverseUI( ( ui ) => {

            ui.enabled = this._show;
            ui.addInput( this._controllers[ nextController ] );

        } );

        if ( controllerID === this._prevController ) return;

        this._controllers[ controllerID ].add( this._pagesGroup );

        if ( !this._prevController ) {
            this._prevController = controllerID;
            return;
        }

        let prevController = this._controllers[ this._prevController ];
        // Removes the UI from the previous controller
        for ( let i = prevController.children.length - 1; i >= 0; i-- ) {
            if ( prevController.children[ i ].name === 'ui' ) {
                prevController.remove( prevController.children[ i ] );
                break;
            }
        }
        this._prevController = controllerID;

    }

    _initControllers( controllers ) {

        this._controllers = controllers;

        // The code below adds a laser pointer to each controller, and hides
        // it by default. This pointer will be used to select element in the
        // GUI, by pointing at it with the opposite controller.
        let geometry = new THREE.Geometry();
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        geometry.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

        let lineMat = new THREE.LineBasicMaterial( {
            color: 0xE67E22,
            opacity: 1,
            linewidth: 3
        } );

        let line0 = new THREE.Line( geometry, lineMat );
        line0.name = 'pointer';
        line0.scale.z = 5;

        let line1 = line0.clone();

        this._controllers[ 0 ].add( line0 );
        setPointerVisibility( this._controllers[ 0 ], false );
        this._controllers[ 1 ].add( line1 );
        setPointerVisibility( this._controllers[ 1 ], false );

        // Keeps track of the pointer meshes, in order to show / hide
        // them more efficiently.
        this._lineMeshes[ 0 ] = line0;
        this._lineMeshes[ 1 ] = line1;

        // Keeps track of the tip meshes, in order to change their material
        // more efficiently.
        this._controllers[ 0 ].traverse( ( elt ) => {
            if ( elt.name === 'tip' ) this._tipMeshes[ 0 ] = elt;
        } );
        this._controllers[ 1 ].traverse( ( elt ) => {
            if ( elt.name === 'tip' ) this._tipMeshes[ 1 ] = elt;
        } );

    }

    _createPageTemplate( gridData ) {

        // Clone the texture to make a symetry for left arrow.
        let rightArrowTex = this._textures.arrowLeft;
        let leftArrowTex = rightArrowTex.clone();
        leftArrowTex.needsUpdate = true;
        leftArrowTex.wrapS = THREE.RepeatWrapping;
        leftArrowTex.repeat.x = - 1;

        // Creates parent layout, containing the Grid Layout and the
        // Horizontal Layout.
        let parentLayout = new VRUI.layout.VerticalLayout( {
            background: this._textures.background,
            padding: { top: 0.05 }
        } )
        .onHoverEnter( this._layoutHoverEnter.bind( this ) )
        .onHoverExit( this._layoutHoverExit.bind( this ) );

        // Creates the Grid Layout containing each ImageButton.
        let gridLayout = new VRUI.layout.GridLayout( {
            id: GRID_ID, columns: gridData.columns, rows: gridData.rows
        }, {
            position: 'left',
            padding: { left: 0.1, right: 0.1, top: 0.1, bottom: 0.1 }
        } );

        // Creates the Horizontal Layout at the bottom containg the
        // previous & next page buttons.
        let bottomLayout = new VRUI.layout.HorizontalLayout(
            null, { height: 0.1 }
        );

        // Creates previous and next buttons for the bottom layout.
        let button = new VRUI.view.ImageButton(
            { innerMaterial: leftArrowTex },
            {
                height: 0.45, aspectRatio: 0.25, position: 'left',
                background: this._textures.buttonBackground
            }
        );
        let button2 = new VRUI.view.ImageButton(
            { innerMaterial: rightArrowTex },
            {
                height: 0.45, aspectRatio: 0.25, position: 'left',
                background: this._textures.buttonBackground
            }
        );

        // Adds both buttons to the layout
        bottomLayout.add( button, button2 );
        // Adds Grid Layout and Horizontal Layout to the parent layout.
        parentLayout.add( gridLayout, bottomLayout );

        // The template is now complete!
        return parentLayout;
    }

    _createColorTemplate() {

        let layout = new VRUI.layout.VerticalLayout( null, {
            background: this._textures.background,
            padding: { top: 0.06 }
        } )
        .onHoverEnter( this._layoutHoverEnter.bind( this ) )
        .onHoverExit( this._layoutHoverExit.bind( this ) );

        let wheel = new VRUI.view.ImageButton( {
            innerMaterial: this._textures.colorWheel
        }, {
            height: 0.65,
            aspectRatio: 1.0
        } )
        .onChange( ( object, data ) => {

            if ( !data.pressed ) return;

            let x = data.info.uv.x - 0.5;
            let y = data.info.uv.y - 0.5;
            this._hsv.s = ( Math.sqrt( x * x + y * y ) * 2.0 );
            let angle = ( 180.0 * Math.atan2( y, x ) ) / Math.PI;
            this._hsv.h = ( ( angle + 300.0 ) % 360.0 ) / 360;
            this._updateColor( this._hsv );

        } );

        let slider = new VRUI.view.SliderView( {
            background: this._textures.slider,
            handle: this._textures.sliderButton
        }, {
            align: 'bottom',
            height: 0.2,
            width: 0.85
        } )
        .onChange( ( object, data ) => {

            this._hsv.v = 1.0 - data.value;
            this._updateColor( this._hsv );

        } );

        layout.add( wheel, slider );
        return layout;

    }

    /*
        The methods below are the callbacks added to every buttons
        in the UI, or to each global laouts. They allow to handle the transparent
        cursor moving on focused elements, or to deal with the pointers.
    */

    _updateColor( ) {

        let controller = ( this._prevController + 1 ) % 2;
        this._tipMeshes[ controller ].material.color.setHSL(
            this._hsv.h, this._hsv.s, this._hsv.v
        );
        EventDispatcher.dispatch( 'colorChange', this._hsv );

    }

    _layoutHoverEnter( object, data ) {

        if ( !data ) return;
        this._lineMeshes[ 0 ].scale.z = data.info.distance;
        this._lineMeshes[ 1 ].scale.z = data.info.distance;

    }

    _layoutHoverExit() {

        this._lineMeshes[ 0 ].scale.z = INIT_POINTER_LEN;
        this._lineMeshes[ 1 ].scale.z = INIT_POINTER_LEN;

    }

    _buttonHoverEnter ( object ) {

        let width = object._background.scale.x;
        let height = object._background.scale.y;

        object.userData.prevScale = {
            x: object.group.scale.x,
            y: object.group.scale.y
        };

        object.group.scale.x *= 1.2;
        object.group.scale.y *= 1.2;

        this._hoverCursor.scale.x = width;
        this._hoverCursor.scale.y = height;

        let position = object.group.position;
        this._hoverCursor.position.x = width / 2;
        this._hoverCursor.position.y = - height * 0.5;
        this._hoverCursor.position.z = position.z + 0.001;
        this._hoverCursor.material.visible = true;

        if ( this._hoverContainer ) this._hoverContainer.group.children.pop();
        object.group.add( this._hoverCursor );
        this._hoverContainer = object;

    }

    _buttonHoverExit( object ) {

        this._hoverCursor.material.visible = false;
        object.group.scale.x = object.userData.prevScale.x;
        object.group.scale.y = object.userData.prevScale.y;

    }

    _traverseUI( callback ) {

        // Home & color traversal.
        for ( let k in this._ui.default ) {
            let ui = this._ui.default[ k ];
            callback( ui );
        }
        // Items UI traversal.
        for ( let k in this._ui.items ) {
            let ui = this._ui.default[ k ];
            callback( ui );
        }

    }

}

export default new UI();
