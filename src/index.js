'use strict';

let THREE = require( 'three' );

let Artflow = require( './artflow' );

let rootScene, camera, renderer;
let geometry, material, mesh;

let canvas;
let canvasPos;
let mousePos;

let vertices, normals, uvs;
let i = 0;

let vrEffect;
let vrControls;

let mouseDown;
let brush;

function createScene() {

    rootScene = new THREE.Scene();

    brush = new Artflow.generation.brush(10000, rootScene, "build/brush1.jpg");
    brush.initBrush();
}

function resize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    vrEffect.setSize( window.innerWidth, window.innerHeight );

}

function init() {

    mouseDown = false;

    let WebVR = Artflow.vr.WebVR;

    renderer = new THREE.WebGLRenderer( {
        antialias: true
    } );

    canvas = renderer.domElement;
    canvasPos = canvas.position;
    mousePos = new THREE.Vector3();


    renderer.setSize( window.innerWidth, window.innerHeight );

    WebVR.checkAvailability().catch( function ( message ) {
        document.body.appendChild( WebVR.getMessageContainer( message ) );
    } );
    WebVR.getVRDisplay( function ( display ) {
        document.body.appendChild( WebVR.getButton( display, renderer.domElement ) );
    } );

    camera = new THREE.PerspectiveCamera( 70,
        window.innerWidth / window.innerHeight, 0.1, 1500 );

    vrEffect = new Artflow.vr.VREffect( renderer );
    vrControls = new Artflow.controls.VRControls( camera );

    createScene();
    document.body.appendChild( renderer.domElement );

    // Registers global events
    window.addEventListener( 'resize', resize, false );
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);

}

function onMouseDown(event) {

    mouseDown = true;

}

function onMouseUp(event) {

  if (mouseDown) {
    brush.initBrush();
    mouseDown = false;
  }
}

document.onmousemove = function(e){
  mousePos.x = e.pageX;
  mousePos.y = -e.pageY;
  mousePos.z = 0;
}

function update() {

    var timer = 1500054205838 * 0.0005;

    camera.position.x = Math.floor(Math.cos( timer ) * 200) + 200;
    camera.position.y = Math.floor(Math.sin( timer ) * 200) - 200;
    camera.position.z = 700;

    if (mouseDown) 
      brush.addPoint(mousePos);

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
