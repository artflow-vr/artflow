'use strict';

let THREE = require( 'three' );

let Artflow = require( './artflow' );

let rootScene, camera, renderer;
let geometry, material, mesh;

let vrEffect;
let vrControls;

function createScene() {

    rootScene = new THREE.Scene();

    geometry = new THREE.BoxGeometry( 200, 200, 200 );
    material = new THREE.MeshBasicMaterial( {
        color: 0xff0000,
        wireframe: true
    } );

    mesh = new THREE.Mesh( geometry, material );
    rootScene.add( mesh );

}

function resize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    vrEffect.setSize( window.innerWidth, window.innerHeight );

}

function init() {

    let WebVR = Artflow.vr.WebVR;

    renderer = new THREE.WebGLRenderer( {
        antialias: true
    } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    WebVR.checkAvailability().catch( function ( message ) {
        document.body.appendChild( WebVR.getMessageContainer( message ) );
    } );
    WebVR.getVRDisplay( function ( display ) {
        document.body.appendChild( WebVR.getButton( display, renderer.domElement ) );
    } );

    camera = new THREE.PerspectiveCamera( 70,
        window.innerWidth / window.innerHeight, 0.1, 1500 );
    camera.position.z = 1000;

    vrEffect = new Artflow.vr.VREffect( renderer );
    vrControls = new Artflow.controls.VRControls( camera );

    createScene();
    document.body.appendChild( renderer.domElement );

    // Registers global events
    window.addEventListener( 'resize', resize, false );
}

function update() {

    /*mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;*/
    camera.position.z = 1000;
}

function render() {

    vrEffect.render( rootScene, camera );

}

function animate() {

    vrEffect.requestAnimationFrame( animate );

    vrControls.update();
    update();
    render();

}

window.onload = function () {

    init();
    animate();

};
