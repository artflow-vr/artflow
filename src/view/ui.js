import { VRUI } from '../../vendor/vr-ui.min';

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

        this._show = false;
        this._pagesGroup = new THREE.Group();
        this._pagesGroup.name = 'ui';

        this._prevController = null;
        this._controllers = new Array( 2 );
    }

    createToolsUI( textures ) {

        for ( let elt of ['background', 'arrowLeft', 'buttonBackground'] ) {
            if ( !textures[ elt ] ) {
                let warnMsg = 'no `' + elt + '\' texture provided.';
                console.warn( 'UI.createToolsUI(): ' + warnMsg );
            }
        }

        let homeUI = this._createHomeUI( textures.background );
        homeUI.root.add(
            this._createArrowLine( textures.arrowLeft, textures.buttonBackground )
        );
        homeUI.root.onHoverEnter( ( evt ) => {
            console.log( 'CALDLAJDKALDDLALAD' );
        } );
        homeUI.root.group.position.z = -0.2;
        homeUI.root.group.position.y = 0.5;

        this._textures = textures;
        this._homeUIs.push( homeUI );
        this._pagesGroup.add( homeUI.root.group );

    }

    addTool( toolID, toolTexture, toolBackground, callback ) {

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
        button.onHoverEnter( ( evt ) => {
            console.log( 'CALDLAJDKALDDLALAD' );
        } );
        button.onHoverExit( ( evt ) => {
            console.log( 'EXIT' );
        } );

        // Adds the button to the GUI GridLayout.
        // If the GridLayout is full, this creates a new page (so a new GUI).
        let nbElts = GUI.root._elements[ 0 ]._elements.length;
        let maxElts = GUI.root._elements[ 0 ].nbRows * GUI.root._elements[ 0 ].nbColumns;
        if ( nbElts === maxElts ) {
            GUI = this._createToolsUI( this._textures );
            this._homeUIs.push( GUI );
            // Hides added page
            GUI.root.group.traverse ( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.visible = false;
                }
            } );
        }

        let grid = GUI.root._elements[ 0 ];
        grid.add( button );

    }

    triggerShow( controllerID ) {

        this._show = !this._show;
        console.log( this._show );
        if ( !this._show ) {
            this._pagesGroup.traverse ( function ( child ) {
                if ( child instanceof THREE.Mesh ) child.visible = false;
            } );
            this._homeUIs[ this._currPage ].enabled = false;
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

    addInputControllers( controllers ) {

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

        let line = new THREE.Line( geometry, lineMat );
        line.name = 'pointer';
        line.scale.z = 5;

        this._controllers[ 0 ].add( line );
        setPointerVisibility( this._controllers[ 0 ], false );
        this._controllers[ 1 ].add( line.clone() );
        setPointerVisibility( this._controllers[ 1 ], false );

    }

    update() {
        this._homeUIs[ this._currPage ].update();
    }

    _updatePage( newValue ) {

        // Hides previous page
        let group = this._homeUIs[ this._currPage ].root.group;
        group.traverse ( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.visible = false;
            }
        } );

        this._currPage = newValue;

        // Shows next page
        group = this._homeUIs[ this._currPage ].root.group;
        group.traverse ( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.visible = true;
            }
        } );

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
        } ).onChange( () => {
            this._updatePage( ( this._currPage + 1 ) % this._homeUIs.length );
        } );

        let rightArrow = new VRUI.view.ImageButton( rightTex, {
            height: 0.45,
            width: 0.1,
            position: 'right',
            margin: { right: 0.1 },
            padding: { top: 0.08, bottom: 0.08, left: 0.01, right: 0.01 },
            background: leftTexBackground
        } ).onChange( () => {
            let val = this._currPage - 1;
            this._updatePage( val < 0 ? this._homeUIs.length - 1 : val );
        } );

        layout.add( leftArrow, rightArrow );
        return layout;

    }

    _createHomeUI ( background ) {

        const guiWidth = 0.5; // In Three.js units.
        const guiHeight = 0.5; // In Three.js units

        let layout = new VRUI.layout.VerticalLayout( {
            background: background,
            padding: {
                top: 0.05
            }
        } );
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
        return new VRUI.VRUI( layout, guiWidth, guiHeight );

    }

}

export default new UI();
