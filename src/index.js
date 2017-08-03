'use strict';

let THREE = require( 'three' );

let Artflow = require( './artflow' );
let ModuleManager = Artflow.modules.ModuleManager;

let MainView = Artflow.view.MainView;

let clock = null;

function resize() {

    ModuleManager.resize( window.innerWidth, window.innerHeight );
    MainView.resize( window.innerWidth, window.innerHeight );

}

function init() {

    MainView.init( window.innerWidth, window.innerHeight );
    ModuleManager.init();

    let renderer = MainView.getRenderer();
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

    MainView.getVREffect().requestAnimationFrame( animate );

    update();
    render();

}

window.onload = function () {

    init();
    animate();

};
