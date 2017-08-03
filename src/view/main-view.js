'use strict';

let THREE = require( 'three' );

let VREffect = require( '../vr/vr-effect' );

let MainView = module.exports;

MainView._camera = null;
MainView._renderer = null;
MainView._rootScene = null;
MainView._vrEffect = null;

MainView.init = function ( w, h ) {

    MainView._renderer = new THREE.WebGLRenderer( {
        antialias: true
    } );
    MainView._renderer.setSize( w, h );

    MainView._camera = new THREE.PerspectiveCamera( 70, w / h, 0.1, 1500 );
    MainView._camera.position.z = 2;
    MainView._camera.position.y = 2;

    MainView._vrEffect = new VREffect( MainView._renderer );

    MainView._createInitialScene();

};

MainView.render = function () {

    MainView._vrEffect.render( MainView._rootScene, MainView._camera );

};

MainView.resize = function ( w, h ) {

    MainView._camera.aspect = w / h;
    MainView._camera.updateProjectionMatrix();
    MainView._vrEffect.setSize( window.innerWidth, window.innerHeight );

};

MainView.getCamera = function () {

    return MainView._camera;

};

MainView.getRenderer = function () {

    return MainView._renderer;

};

MainView.getRootScene = function () {

    return MainView._rootScene;

};

MainView.getVREffect = function () {

    return MainView._vrEffect;

};

MainView._createInitialScene = function () {

    MainView._rootScene = new THREE.Scene();
    MainView.fog = new THREE.FogExp2( 0x000000, 0.0128 );

    let grid = new THREE.GridHelper( 100, 100, 0xffffff, 0xffffff );

    let geometry = new THREE.BoxGeometry( 2, 2, 2 );
    let material = new THREE.MeshBasicMaterial( {
        color: 0xff0000,
        wireframe: true
    } );
    let mesh = new THREE.Mesh( geometry, material );

    MainView._rootScene.add( grid );
    MainView._rootScene.add( mesh );

    MainView._renderer.setClearColor( MainView.fog.color, 1 );

};
