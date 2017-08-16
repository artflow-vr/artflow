'use strict';

let THREE = window.THREE;

let AssetManager = require( '../utils/asset-manager' );

let HTMLView = require( './html-view' );
let HTMLTextArea = require( './html-text-area' );

let MiscInfoTable = require( '../utils/info-table' ).misc;

let MainView = module.exports;

/**
 * This Object contains data related to THREE.JS. It represents the entry
 * point of the world, regarding the rendering.
 *
 * @param  {number} w The width of the element to render in.
 * @param  {number} h The height of the element to render in.
 * @param  {THREE.WebGLRenderer} renderer THREE.JS renderer
 */
MainView.init = function ( w, h, renderer, vr ) {

    this._renderer = renderer;

    this._camera = new THREE.PerspectiveCamera( 70, w / h, 0.1, 100 );

    // The _group variable allows us to modify the position of
    // the world according to camera teleportation.
    this._group = new THREE.Group();
    this._createInitialScene( vr );

    this._rootScene = new THREE.Scene();
    this._rootScene.add( this._group );

    // Adds default cubemap as background of the scene
    // TODO: Update the THREE.JS version with the update handling background
    // on both eyes.
    if ( !vr ) {
        let cubemap = AssetManager.assets.textures[ AssetManager.DEFAULT_CBMAP ];
        this._rootScene.background = cubemap;
    } else {
        this._rootScene.background = 0xcccccc;
    }

    this._createLightning();

    this.backgroundView = null;
    this.clickView = null;
    this._createHTMLBackground();

};

/**
 * In charge of rendering the THREE.JS root scene.
 */
MainView.render = function () {

    this._renderer.render( this._rootScene, this._camera );

};

/**
 * Handles the resizing of the scene.
 */
MainView.resize = function ( w, h ) {

    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();

};

/**
 * Adds a given THREE.Object3D to a special group. This group is affected by
 * the camera moves and teleportation.
 *
 * @param  {THREE.Object3D} object Object to add to the scene.
 */
MainView.addToMovingGroup = function ( object ) {

    this._group.add( object );

};

/**
 * Adds a given THREE.Object3D to the root scene. Root scene objects are not
 * affected by teleportation or camera moves.
 *
 * @param  {THREE.Object3D} object Object to add to the scene.
 */
MainView.addToScene = function ( object ) {

    this._rootScene.add( object );

};

MainView.getCamera = function () {

    return MainView._camera;

};

MainView.getRenderer = function () {

    return this._renderer;

};

MainView.getGroup = function () {

    return this._group;

};

MainView._createInitialScene = function ( vr ) {

    if ( vr ) return;

    let grid = new THREE.GridHelper( 10, 10, 0xbdc3c7, 0xbdc3c7 );

    let geometry = new THREE.BoxGeometry( 1, 1, 1 );
    let centerCube = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial( {
        color: 0x95a5a6,
        wireframe: false,
        metalness: 0.0,
        roughness: 1.0
    } ) );
    let xAxisCube = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
        color: 0xff0000,
        wireframe: true
    } ) );

    centerCube.translateY( 0.5 );
    xAxisCube.translateX( 2 );

    this._group.add( grid );
    this._group.add( centerCube );
    this._group.add( xAxisCube );

};

MainView._createLightning = function () {

    // Creates the lightning
    let hemLight = new THREE.HemisphereLight( 0X000000, 0x2C3E50, 1.0 );
    this._rootScene.add( hemLight );

    let dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    dirLight.position.set( 100, 100, 100 );
    this._rootScene.add( dirLight );

};

MainView._createHTMLBackground = function () {

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

};
