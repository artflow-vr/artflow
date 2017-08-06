'use strict';

let THREE = window.THREE;

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

    this._camera = new THREE.PerspectiveCamera( 70, w / h, 0.1, 1500 );
    this._camera.position.z = 2;
    this._camera.position.y = 2;

    this._rootScene = null;

    this._createInitialScene();

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

MainView.addToScene = function ( object ) {

    this._rootScene.add( object );

};

MainView.getCamera = function () {

    return MainView._camera;

};

MainView.getRenderer = function () {

    return this._renderer;

};

MainView.getRootScene = function () {

    return this._rootScene;

};

MainView._createInitialScene = function () {

    this._rootScene = new THREE.Scene();
    let fog = new THREE.FogExp2( 0x001c2d, 0.0125 );

    let grid = new THREE.GridHelper( 100, 100, 0xbdc3c7, 0xbdc3c7 );

    let geometry = new THREE.BoxGeometry( 2, 2, 2 );
    let material = new THREE.MeshBasicMaterial( {
        color: 0xff0000,
        wireframe: true
    } );
    let mesh = new THREE.Mesh( geometry, material );

    this._renderer.setClearColor( fog.color, 1 );

    this._rootScene.add( grid );
    this._rootScene.add( mesh );

};
