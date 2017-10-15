import { VRUI } from '../../vendor/vr-ui.min';

class UI {

    constructor() {

        this._currPage = 0;
        this._textures = null;
        this._homeUIs = [];

        this._show = true;
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
        if ( this._show ) {
            if ( this._prevController ) {
                let controller = this._controllers[ this._prevController ];
                // Removes the UI from the previous controller
                for ( let i = controller.children.length - 1; i >= 0; i-- ) {
                    if ( controller.children[ i ].name === 'ui' ) {
                        controller.remove( controller.children[ i ] );
                        console.log( 'édlaldald' );
                        break;
                    }
                }
            }
            // Adds the UI to the next controller
            this._prevController = controllerID;
            this._controllers[ controllerID ].add( this._pagesGroup );
            this._homeUIs[ this._currPage ].enabled = true;
            this._homeUIs[ this._currPage ].addInput( this._controllers[ controllerID ] );
            this._pagesGroup.traverse ( function ( child ) {
                if ( child instanceof THREE.Mesh ) child.visible = true;
            } );
            return;
        }

        this._pagesGroup.traverse ( function ( child ) {
            if ( child instanceof THREE.Mesh ) child.visible = false;
        } );
        this._homeUIs[ this._currPage ].enabled = false;
    }

    addInputControllers( controllers ) {

        this._controllers = controllers;

        let geometry = new THREE.Geometry();
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        geometry.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

        let line = new THREE.Line( geometry );
        line.name = 'line';
        line.scale.z = 5;

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
