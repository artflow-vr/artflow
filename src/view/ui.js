import VRUI from 'vr-ui';

import MainView from './main-view';
import EventDispatcher from '../utils/event-dispatcher';

const INIT_POINTER_LEN = 3.5;

const GUI_WIDTH = 0.4; // In Three.js units.
const GUI_HEIGHT = 0.4; // In Three.js units

const DEFAULT_HOME_POS = new THREE.Vector3( 0, 0.5, -0.2 );
const DEFAULT_COLOR_POS = new THREE.Vector3( 0.75, 0.5, 0.5 );

const GUI_FACTOR_NO_VR = 4.0;

const GRID_ID = 'elementGrid';
const TOOL_GRID_SIZE = { columns: 4, rows: 3 };
const ITEMS_GRID_SIZE = { columns: 4, rows: 4 };

const HOVER_GEOM = new THREE.PlaneGeometry( 1, 1 );

const HOVER_MATERIAL = new THREE.MeshBasicMaterial( {
    color: 0xFFFFFF,
    opacity: 1.0,
    transparent: true,
    visible: false
} );

let setPointerVisibility = ( element, visibility ) => {
    let child = null;
    for ( let i = 0; i < element.children.length; ++i ) {
        child = element.children[ i ];
        if ( child.name === 'pointer' ) child.visible = visibility;
    }
};

class UI {

    constructor() {

        // This variable allows us to know if *any* of all the UI
        // is targeted by the cursor.
        // This is really important to stop event propagation.
        this.hover = false;

        this._vr = null;
        this._textures = null;

        // Contains all the UI's:
        //  * Home: contains the tools
        //  * Color: contains the color wheel
        //  * Items: contains the VRUI *for each* tool
        this._ui = {
            home: null,
            color: null,
            items: {}
        };
        this._dimensions = { width: 0.0, height: 0.0 };
        this._templates = {
            home: null,
            items: null,
            color: null
        };

        this._show = false;
        this._pagesGroup = new THREE.Group();
        this._pagesGroup.name = 'ui';

        // This variable allows us to quickly hide an item UI, without
        // having to loop through every UI. When no item UI is currently open,
        // this variable has a null value.
        this._currItemUI = null;

        this._prevController = null;
        this._controllers = null;

        // Cache reference toward each line making the pointer mesh.
        // This allows to avoid retrieving them at each update.
        this._lineMeshes = null;
        this._tipMeshes = null;

        this._hoverContainer = null;
        this._hoverCursor = null;

        // Cache refrences to data extracted from the UI.
        // This alow to avoid instanciating temporary values, that are often
        // discarded.
        this._hsv = { h : 0.0, s : 0.0, v : 0.5 };

    }

    init( textures, controllers ) {

        this._vr = controllers !== undefined && controllers !== null;
        this._textures = textures;

        this._templates.home = this._createPageTemplate( TOOL_GRID_SIZE, true );
        this._templates.items = this._createPageTemplate( ITEMS_GRID_SIZE );
        this._templates.color = this._createColorTemplate( );

        this._dimensions.width = GUI_WIDTH;
        this._dimensions.height = GUI_HEIGHT;

        // We activate the callback for laser pointer only when using
        // VR controllers.
        if ( this._vr ) {
            this._initControllers( controllers );
            // Changes the function pointer at init time.
            this.triggerShow = this._triggerShowVR;

            let enterCallback = this._layoutHoverEnter.bind( this );
            let exitCallback = this._layoutHoverExit.bind( this );

            this._templates.home.onHoverEnter( enterCallback )
                                .onHoverExit( exitCallback );
            this._templates.color.onHoverEnter( enterCallback )
                                 .onHoverExit( exitCallback );
        } else {
            // Changes the function pointer at init time.
            this.triggerShow = this._triggerShowNOVR;
            // Changes the size of the GUI because camera is not as close
            // to the objects in Non-VR as in VR.
            this._dimensions.width *= GUI_FACTOR_NO_VR;
            this._dimensions.height *= GUI_FACTOR_NO_VR;
            // If we are not in VR, we will hack to position the UI in the world,
            // close to the origin. This is nice just to see how ArtFlow works,
            // and does not provide a good experience.
            MainView._group.add( this._pagesGroup );
            this._pagesGroup.position.x = 0.0;
            this._pagesGroup.position.y = 2.0;
            this._pagesGroup.position.z = 0.0;
        }

        // Color UI.
        this._ui.color = new VRUI.VRUI( {
            width: this._dimensions.width,
            height: this._dimensions.height
        } , this._templates.color );

        this._ui.color.pageGroup.rotation.y = - Math.PI / 2.0;
        this._ui.color.pageGroup.position.set(
            DEFAULT_COLOR_POS.x, DEFAULT_COLOR_POS.y, DEFAULT_COLOR_POS.z
        );

        this._traverseUI( ( ui ) => {

            if ( !ui ) return;

            if ( !this._vr ) {
                ui.enableMouse( MainView._camera, MainView._renderer );
                ui.pages[ 0 ].setVisible( true );
            }

            ui.refresh();

            // Adds each UI to the `pageGroup' variable.
            this._pagesGroup.add( ui.pageGroup );

        } );

        // Creates the cursor used hover the UI.
        HOVER_MATERIAL.map = textures.buttonHover;
        this._hoverCursor = new THREE.Mesh( HOVER_GEOM, HOVER_MATERIAL );

    }

    update() {

        this.hover = false;
        this._traverseUI( ( ui ) => {

            this.hover = this.hover || ( ui.update() !== null );

        } );

    }

    addTool( tool, background, callback ) {

        let toolID = tool.id;
        let texture = tool.data.uiTexture;
        let homeGUI = this._ui.home;

        let events = {
            enter: this._buttonHoverEnter.bind( this ),
            exit: this._buttonHoverExit.bind( this ),
            change: this._homeToolChanged.bind( this, callback )
        };

        this._ui.home = this._add( toolID, homeGUI, {
            background: background,
            button: texture
        }, events );

    }

    addToolItem( toolID, item, background, callback ) {

        let texture = item.data.uiTexture;
        let events = {
            change: ( object, evt ) => {
                let controllerID = ( this._prevController + 1 ) % 2;
                callback( toolID, controllerID, evt );
            }
        };

        let itemsUI = this._ui.items[ toolID ];
        let ui = this._add(
            toolID, itemsUI, { background: background, button: texture },
            events, true
        );

        // Shows the items UI only if it was previously visible.
        let show = this._show && !this._ui.home.enabled;
        this._hideShowUI( ui, show );

        this._ui.items[ toolID ] = ui;

    }

    setPressed( trigger ) {

        this._traverseUI( ( ui ) => {

            ui.setPressed( trigger );

        } );

    }

    _add( id, ui, textures, events, isItem ) {

        let button = new VRUI.view.ImageButton( {
            innerMaterial: textures.button
        }, {
            height: 0.7,
            aspectRatio: 1.0,
            background: textures.background
        } );
        button.userData.id = id;

        if ( events.enter )
            button.onHoverEnter( events.enter );
        if ( events.exit )
            button.onHoverExit( events.exit );
        if ( events.change )
            button.onChange( events.change );

        let outUi = ui;
        // We are attempting to add a button inside the UI, but it has not
        // been created yet, we create it!
        if ( !outUi ) {
            let template = isItem ? this._templates.items : this._templates.home;
            outUi = new VRUI.VRUI( {
                width: this._dimensions.width,
                height: this._dimensions.height,
                mode: { template: template }
            } );
            outUi.pageGroup.position.set(
                DEFAULT_HOME_POS.x, DEFAULT_HOME_POS.y, DEFAULT_HOME_POS.z
            );
            // Adds the newly created UI to the UI group.
            this._pagesGroup.add( outUi.pageGroup );

            // If we are not in VR, we have to force the UI to use
            // the mouse.
            if ( !this._vr )
                outUi.enableMouse( MainView._camera, MainView._renderer );
        }

        outUi.add( button, GRID_ID );
        outUi.refresh();
        return outUi;

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
        this._lineMeshes = new Array( 2 );
        this._lineMeshes[ 0 ] = line0;
        this._lineMeshes[ 1 ] = line1;

        // Keeps track of the tip meshes, in order to change their material
        // more efficiently.
        this._tipMeshes = new Array( 2 );
        this._controllers[ 0 ].traverse( ( elt ) => {
            if ( elt.name === 'tip' ) this._tipMeshes[ 0 ] = elt;
        } );
        this._controllers[ 1 ].traverse( ( elt ) => {
            if ( elt.name === 'tip' ) this._tipMeshes[ 1 ] = elt;
        } );

    }

    _createPageTemplate( gridData, isHome ) {

        let textures = this._textures;
        let gridInfo = gridData || { columns: 1, rows: 1 };

        // Clone the texture to make a symetry for left arrow.
        let rightArrowTex = textures.arrowLeft;
        let leftArrowTex = rightArrowTex.clone();
        leftArrowTex.needsUpdate = true;
        leftArrowTex.wrapS = THREE.RepeatWrapping;
        leftArrowTex.repeat.x = - 1;

        // Creates parent layout, containing the Grid Layout and the
        // Horizontal Layout.
        let parentLayout = new VRUI.layout.VerticalLayout( null, {
            background: textures.background,
            padding: { top: 0.05, bottom: 0.18 }
        } );

        // Creates the Grid Layout containing each ImageButton.
        let gridLayout = new VRUI.layout.GridLayout( {
            id: GRID_ID, columns: gridInfo.columns, rows: gridInfo.rows
        }, {
            position: 'left',
            padding: { left: 0.1, right: 0.1, top: 0.1 }
        } );

        // Creates the Horizontal Layout at the bottom containg the
        // previous & next page buttons.
        let bottomLayout = new VRUI.layout.HorizontalLayout(
            null,
            {
                height: 0.2,
                padding: { left: 0.1, right: 0.1 }
            }
        );

        // Creates previous and next buttons for the bottom layout.
        let button = new VRUI.view.ImageButton(
            { innerMaterial: leftArrowTex },
            {
                height: 0.5, aspectRatio: 1.0, position: 'left',
                background: textures.buttonBackground
            }
        );
        let button2 = new VRUI.view.ImageButton(
            { innerMaterial: rightArrowTex },
            {
                height: 0.5, aspectRatio: 1.0, position: 'right',
                background: textures.buttonBackground
            }
        );

        // Adds both buttons to the layout
        bottomLayout.add( button );
        // Adds Grid Layout and Horizontal Layout to the parent layout.
        parentLayout.add( gridLayout, bottomLayout );

        if ( !isHome ) {
            let homeButton = new VRUI.view.ImageButton(
                { innerMaterial: textures.home },
                {
                    height: 1.0, aspectRatio: 1.0, position: 'left',
                    margin: { left: 0.32, bottom: 0.05 },
                    background: textures.buttonBackground
                }
            ).onChange( this._homeButtonChanged.bind( this ) );
            bottomLayout.add( homeButton );
        }

        bottomLayout.add( button2 );
        // The template is now complete!
        return parentLayout;
    }

    _createColorTemplate() {

        let textures = this._textures;
        let layout = new VRUI.layout.VerticalLayout( null, {
            background: textures.background, padding: { top: 0.06 }
        } );

        let wheel = new VRUI.view.ImageButton( {
            innerMaterial: textures.colorWheel
        }, {
            height: 0.65, aspectRatio: 1.0
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
            background: textures.slider,
            handle: textures.sliderButton
        }, {
            align: 'bottom', height: 0.2, width: 0.85
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

        EventDispatcher.dispatch( 'colorChange', this._hsv );
        if ( !this._tipMeshes ) return;

        let controller = ( this._prevController + 1 ) % 2;
        this._tipMeshes[ controller ].material.color.setHSL(
            this._hsv.h, this._hsv.s, this._hsv.v
        );

    }

    _homeButtonChanged( object, evt ) {

        if ( !evt.pressed ) return;

        let itemsUI = this._ui.items[ this._currItemUI ];
        // Hides itemUI
        this._hideShowUI( itemsUI, false );
        // Shows Home UI
        this._hideShowUI( this._ui.home, true );

        // Do not forget to set the variable to null to indicate
        // that no items UI is open.
        this._currItemUI = null;

    }

    _homeToolChanged( callback, object, evt ) {

        let id = object.userData.id;

        let controllerID = ( this._prevController + 1 ) % 2;
        callback( id, controllerID, evt );

        // Display the items UI if the tool support it.
        if ( id in this._ui.items ) {
            // Hides Home UI
            this._hideShowUI( this._ui.home, false );
            // Displays items UI
            this._hideShowUI( this._ui.items[ id ], true );
            this._currItemUI = id;
        }

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

    _hideShowUI( ui, trigger ) {

        ui.pageGroup.traverse ( function ( child ) {

            if ( child instanceof THREE.Mesh )
                child.visible = trigger;

        } );
        ui.enabled = trigger;

    }

    _traverseUI( callback ) {

        // ArtFlow will not change on this. We do not need to over engineer,
        // we can hardcode the traversal.

        // Applies on home UI.
        callback( this._ui.home );
        callback( this._ui.color );
        // Items UI traversal.
        for ( let k in this._ui.items ) callback( this._ui.items[ k ] );

    }

}

export default new UI();
