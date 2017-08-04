'use strict';

let THREE = require( 'three' );

let Artflow = require( './artflow' );
let ModuleManager = Artflow.modules.ModuleManager;

let MainView = Artflow.view.MainView;

let renderer = null;
let clock = null;

function resize() {

    ModuleManager.resize( window.innerWidth, window.innerHeight );
    MainView.resize( window.innerWidth, window.innerHeight );

}

function init() {

    let w = window.innerWidth;
    let h = window.innerHeight;

    renderer = new THREE.WebGLRenderer( {
        antialias: true
    } );
    renderer.setSize( w, h );
    renderer.vr.enabled = true;
    renderer.vr.standing = true;

    MainView.init( w, h, renderer );
    ModuleManager.init();

    document.body.appendChild( renderer.domElement );

    // Registers global events
    window.addEventListener( 'resize', resize, false );

    clock = new THREE.Clock();

}

function update() {

    let delta = clock.getDelta();
    ModuleManager.update( delta );

}

function render() {

    MainView.render();

}

function animate() {

    update();
    render();

}

window.onload = function () {

    init();
    renderer.animate( animate );

};
