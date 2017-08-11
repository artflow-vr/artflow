'use strict';

let THREE = window.THREE;

let AssetManager = require( '../utils/asset-manager' );


let MainView = module.exports;

/**
 * This Object contains data related to THREE.JS. It represents the entry
 * point of the world, regarding the rendering.
 *
 * @param  {number} w The width of the element to render in.
 * @param  {number} h The height of the element to render in.
 * @param  {THREE.WebGLRenderer} renderer THREE.JS renderer
 */
MainView.init = function ( w, h, renderer ) {

    this._renderer = renderer;

    this._camera = new THREE.PerspectiveCamera( 70, w / h, 0.1, 100 );

    // The _group variable allows us to modify the position of
    // the world according to camera teleportation.
    this._group = new THREE.Group();
    this._createInitialScene();

    this._rootScene = new THREE.Scene();
    this._rootScene.add( this._group );

    // Adds default cubemap as background of the scene
    let cubemap = AssetManager.assets.textures[ AssetManager.DEFAULT_CBMAP ];
    this._rootScene.background = cubemap;

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

MainView._createInitialScene = function () {

    //let fog = new THREE.FogExp2( 0x001c2d, 0.0125 );

    let grid = new THREE.GridHelper( 100, 100, 0xbdc3c7, 0xbdc3c7 );

    let geometry = new THREE.BoxGeometry( 1, 1, 1 );
    let centerCube = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
        color: 0x000000,
        wireframe: false
    } ) );
    let xAxisCube = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
        color: 0xff0000,
        wireframe: true
    } ) );

    //this._renderer.setClearColor( fog.color, 1 );

    centerCube.translateY( 0.5 );
    xAxisCube.translateX( 2 );

    this._group.add( grid );
    this._group.add( centerCube );
    this._group.add( xAxisCube );

};
