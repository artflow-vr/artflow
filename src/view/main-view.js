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

import * as Utils from '../utils/utils';
import HTMLView from './html-view';
import HTMLTextArea from './html-text-area';
import '../../vendor/ImageUtils';

let AssetManager = Utils.AssetManager;
let MiscInfoTable = Utils.InfoTable.misc;

class Main {

    constructor() {

        // The _group variable allows us to modify the position of
        // the world according to camera teleportation.
        this._group = new THREE.Group();

        this.controllers = null;

        this._rootScene = new THREE.Scene();
        this._rootScene.add( this._group );

        this._renderer = null;
        this._camera = null;

        this.backgroundView = null;
        this.clickView = null;

    }

    init( w, h, renderer, vr ) {

        this._renderer = renderer;
        this._camera = new THREE.PerspectiveCamera( 70, w / h, 0.1, 100 );

        this._createInitialScene( vr );

        // Adds default cubemap as background of the scene
        // TODO: Update the THREE.JS version with the update handling background
        // on both eyes.
        if ( !vr ) {
            let cubemap = AssetManager.assets.cubemap.cubemap;
            this._rootScene.background = cubemap;
        } else {
            renderer.setClearColor( 0xcccccc, 1 );
        }

        this._createLighting();
        this._createHTMLBackground();

    }

    render() {

        this._renderer.render( this._rootScene, this._camera );

    }

    resize( w, h ) {

        this._camera.aspect = w / h;
        this._camera.updateProjectionMatrix();

    }

    addToMovingGroup( object ) {

        this._group.add( object );

    }

    addToScene( object ) {

        this._rootScene.add( object );

    }

    getCamera() {

        return this._camera;

    }

    getRenderer() {

        return this._renderer;

    }

    getGroup() {

        return this._group;
    }

    _createInitialScene( vr ) {

        let floorTex = AssetManager.assets.texture.floor;
        let floor = new THREE.Mesh( new THREE.PlaneGeometry( 6, 6 ),
            new THREE.MeshLambertMaterial( {
                map: floorTex
            } )
        );
        floor.rotateX( -Math.PI / 2 );
        this._group.add( floor );

        if ( vr ) return;

        let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        let centerCube = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial( {
                color: 0x95a5a6,
                wireframe: false,
                metalness: 0.0,
                roughness: 1.0
            } )
        );
        let xAxisCube = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial( {
                color: 0xff0000,
                wireframe: true
            } )
        );
        let zAxisCube = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial( {
                color: 0x0000ff,
                wireframe: true
            } )
        );

        centerCube.translateY( 0.5 );
        xAxisCube.translateX( 2 );
        zAxisCube.translateZ( 2 );

        /*this._group.add( centerCube );
        this._group.add( xAxisCube );
        this._group.add( zAxisCube );*/

    }

    _createLighting() {

        // Creates the lightning
        //let hemLight = new THREE.HemisphereLight( 0X000000, 0x2C3E50, 1.0 );
        //this._rootScene.add( hemLight );

        let dirLight = new THREE.DirectionalLight( 0xffffff, 0.7 );
        dirLight.position.set( -0.58, 0.65, 0.51 );
        this._rootScene.add( dirLight );

        let pLight = new THREE.DirectionalLight( 0xffffff, 0.7 );
        pLight.position.set( 0, 0, 0 );
        this._rootScene.add( pLight );

        let ambLight = new THREE.AmbientLight( 0xf0f0f0 );
        this._rootScene.add( ambLight );

    }

    _createHTMLBackground() {

        let backgroundStyle = {
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '0px',
            backgroundColor: 'rgba(44, 62, 80, 0.98)'
        };
        let messageViewStyle = {
            position: 'relative',
            top: '50%'
        };

        let backgroundView = new HTMLView( backgroundStyle );
        backgroundView.setProp( 'align', 'center' );

        let messageView = new HTMLTextArea( null, messageViewStyle );
        messageView.setMessage( MiscInfoTable.startPointerLocking );

        backgroundView.addChild( messageView );

        this.backgroundView = backgroundView;
        this.clickView = messageView;

        document.body.appendChild( this.backgroundView.getDOMElement() );

        this.backgroundView.toggleVisibility( false );

    }

}

export default new Main();
