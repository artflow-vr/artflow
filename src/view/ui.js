import VRUI from 'vr-ui';

import EventDispatcher from '../utils/event-dispatcher';

const INIT_POINTER_LEN = 3.5;
const GUI_WIDTH = 0.4; // In Three.js units.
const GUI_HEIGHT = 0.4; // In Three.js units

let setPointerVisibility = ( element, visibility ) => {
    let child = null;
    for ( let i = 0; i < element.children.length; ++i ) {
        child = element.children[ i ];
        if ( child.name === 'pointer' ) child.visible = visibility;
    }
};

class UI {

    constructor() {

        this._currPage = 0;
        this._textures = null;
        this._homeUIs = [];
        this._colorUI = null;
        this._itemsUI = {};

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

    init( textures, controllers ) {

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

        this._vr = controllers !== undefined && controllers !== null;
        if ( this._vr ) {
            this._initControllers( controllers );
            this.triggerShow = this._triggerShowVR;
        }

        // Creates the initial UI page.
        this._createToolsUI();

        // Creates the Color UI
        this._colorUI = this._createColorUI( textures );
        this._colorUI.refresh();
        this._colorUI.root.group.rotation.y = - Math.PI / 2.0;
        this._colorUI.root.group.position.x = 0.25;
        this._colorUI.root.group.position.z = -0.2;
        this._colorUI.root.group.position.y = 0.5;
        this._pagesGroup.add( this._colorUI.root.group );

    }

    update() {

        this._hoverAnyUI = this._homeUIs[ this._currPage ].update();
        this._hoverAnyUI = this._hoverAnyUI || this._colorUI.update();

    }

    addTool( tool, toolBackground, callback ) {

        let toolID = tool.id;
        let toolTexture = tool.data.uiTexture;

        if ( !toolTexture ) {
            let warnMsg = 'provided texture is undefined.';
            console.warn( 'UI.addTool(): ' + warnMsg );
            return;
        }

        let GUI = this._homeUIs[ this._homeUIs.length - 1 ];
        if ( !GUI ) {
            let warnMsg = 'you have to create a UI before using addTool';
            console.warn( 'UI.addTool(): ' + warnMsg );
            return;
        }

        let button = new VRUI.view.ImageButton( toolTexture, {
            height: 0.7,
            aspectRatio: 1.0,
            padding: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 },
            background: toolBackground
        } );
        button.userData.id = toolID;
        button.onHoverEnter( this._buttonHoverEnter.bind( this ) );
        button.onHoverExit( this._buttonHoverExit.bind( this ) );
        button.onChange( ( object, evt ) => {

            let controllerID = ( this._prevController + 1 ) % 2;
            callback( toolID, controllerID, evt );

        } );

        let grid = GUI.root._elements[ 0 ];
        grid.add( button );

        // Creates a grid for each tool added.
        let items = tool.data.Tool.items;
        if ( items ) {
            this._itemsUI[ toolID ] = this._createGridUI( this.textures.background );
            let root = this._itemsUI[ toolID ].root._elements[ 0 ];
            for ( let item of items ) {
                let buttonItem = new VRUI.view.ImageButton( item.uiTexture, {
                    height: 0.4,
                    aspectRatio: 1.0,
                    padding: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 },
                    background: toolBackground
                } );
                root.add( buttonItem );
            }
        }

    }

    isHoverUI() {

        return this._hoverAnyUI;

    }

    setPressed( trigger ) {

        for ( let ui of this._homeUIs ) ui.setPressed( trigger );

        this._colorUI.setPressed( trigger );

    }

    /*
        The `_triggerShowNOVR()` and `_triggerShowVR()` method are bound
        when calling the `init()` method.
        It avoids checking each time the method is called, whether we are in
        VR or not.
    */

    _triggerShowNOVR() {

        this._show = !this._show;
        if ( this._show ) {
            this._pagesGroup.traverse ( function ( child ) {
                if ( child instanceof THREE.Mesh ) child.visible = true;
            } );
            return;
        }
        this._pagesGroup.traverse ( function ( child ) {
            if ( child instanceof THREE.Mesh ) child.visible = false;
        } );

    }

    _triggerShowVR( controllerID ) {

        this._show = !this._show;
        if ( !this._show ) {
            this._pagesGroup.traverse ( function ( child ) {
                if ( child instanceof THREE.Mesh ) child.visible = false;
            } );
            this._homeUIs[ this._currPage ].enabled = false;
            this._colorUI.enabled = false;
            setPointerVisibility( this._controllers[ 0 ], false );
            setPointerVisibility( this._controllers[ 1 ], false );
            return;
        }

        // Re-displays the UI, and reactivate the input with the opposite
        // controller.
        let nextController = ( controllerID + 1 ) % 2;
        this._pagesGroup.traverse ( function ( child ) {
            if ( child instanceof THREE.Mesh ) child.visible = true;
        } );
        this._homeUIs[ this._currPage ].enabled = true;
        this._homeUIs[ this._currPage ].addInput( this._controllers[ nextController ] );
        this._colorUI.enabled = true;
        this._colorUI.addInput( this._controllers[ nextController ] );
        setPointerVisibility( this._controllers[ nextController ], true );

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

    _createToolsUI() {

        let textures = this._textures;
        let homeUI = this._createGridUI( textures.background );
        homeUI.root.add(
            this._createArrowLine( textures.arrowLeft, textures.buttonBackground )
        );
        homeUI.root.group.position.z = -0.2;
        homeUI.root.group.position.y = 0.5;

        this._homeUIs.push( homeUI );
        this._pagesGroup.add( homeUI.root.group );

    }

    _createItemsUI() {

        this._itemsUI = this._createGridUI( this._textures.background );
        this._itemsUI.root.group.rotation.y = Math.PI / 2.0;
        this._itemsUI.root.group.position.x = - 0.25;
        this._itemsUI.root.group.position.z = 0.2;
        this._itemsUI.root.group.position.y = - 0.5;

    }

    _createArrowLine( rightTex, leftTexBackground ) {

        let layout = new VRUI.layout.HorizontalLayout( {
            height: 0.2,
            background: null,
            align: 'bottom'
        } );

        let leftTex = rightTex.clone();
        leftTex.needsUpdate = true;
        leftTex.wrapS = THREE.RepeatWrapping;
        leftTex.repeat.x = - 1;

        let leftArrow = new VRUI.view.ImageButton( leftTex, {
            height: 0.45,
            width: 0.1,
            position: 'left',
            margin: { left: 0.1 },
            padding: { top: 0.08, bottom: 0.08, left: 0.01, right: 0.01 },
            background: leftTexBackground
        } );

        let rightArrow = new VRUI.view.ImageButton( rightTex, {
            height: 0.45,
            width: 0.1,
            position: 'right',
            margin: { right: 0.1 },
            padding: { top: 0.08, bottom: 0.08, left: 0.01, right: 0.01 },
            background: leftTexBackground
        } );

        layout.add( leftArrow, rightArrow );
        return layout;

    }

    _createGridUI ( background ) {

        let layout = new VRUI.layout.VerticalLayout( {
            background: background,
            padding: {
                top: 0.05
            }
        } )
        .onHoverEnter( this._layoutHoverEnter.bind( this ) )
        .onHoverExit( this._layoutHoverExit.bind( this ) );

        let gridLayout = new VRUI.layout.GridLayout( {
            height: 0.8,
            columns: 4,
            rows: 3,
            hspace: 0.0,
            vspace: 0.0
        }, {
            position: 'left',
            padding: {
                left: 0.1,
                right: 0.1,
                top: 0.1,
                bottom: 0.1
            }
        } );

        layout.add( gridLayout );
        return new VRUI.VRUI( layout, GUI_WIDTH, GUI_HEIGHT );

    }

    _createColorUI( textures ) {

        let layout = new VRUI.layout.VerticalLayout( {
            background: textures.background,
            padding: { top: 0.06 }
        } )
        .onHoverEnter( this._layoutHoverEnter.bind( this ) )
        .onHoverExit( this._layoutHoverExit.bind( this ) );

        let wheel = new VRUI.view.ImageButton( textures.colorWheel, {
            height: 0.65,
            aspectRatio: 1.0
        } )
        .onChange( ( object, data ) => {

            if ( data.pressed ) {
                let x = data.info.uv.x - 0.5;
                let y = data.info.uv.y - 0.5;
                this._hsv.s = ( Math.sqrt( x * x + y * y ) * 2.0 );
                let angle = ( 180.0 * Math.atan2( y, x ) ) / Math.PI;
                this._hsv.h = ( ( angle + 300.0 ) % 360.0 ) / 360;
                this._updateColor( this._hsv );
            }

        } );

        let slider = new VRUI.view.SliderView( {
            background: textures.slider,
            handle: textures.sliderButton
        }, {
            align: 'bottom',
            height: 0.2,
            width: 0.85
        } ).onChange( ( object, data ) => {

            this._hsv.v = 1.0 - data.value;
            this._updateColor( this._hsv );

        } );

        layout.add( wheel, slider );
        return new VRUI.VRUI( layout, GUI_WIDTH, GUI_HEIGHT );

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

}

export default new UI();
