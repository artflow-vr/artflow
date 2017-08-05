'use strict';

window.THREE = require( 'three' );
let THREE = window.THREE;

let Artflow = require( './artflow' );
let ModuleManager = Artflow.modules.ModuleManager;

let AssetManager = Artflow.utils.AssetManager;

let MainView = Artflow.view.MainView;

let renderer = null;
let clock = null;

function update() {

    let delta = clock.getDelta();
    ModuleManager.update( delta );

}

function render() {

    MainView.render();

}

function resize() {

    ModuleManager.resize( window.innerWidth, window.innerHeight );
    MainView.resize( window.innerWidth, window.innerHeight );

}

function animate() {

    update();
    render();

}

function init() {

    clock = new THREE.Clock();

    let w = window.innerWidth;
    let h = window.innerHeight;

    MainView.init( w, h, renderer );
    ModuleManager.init();

    // Registers global events
    window.addEventListener( 'resize', resize, false );

    renderer.animate( animate );

}

window.onload = function () {

    let w = window.innerWidth;
    let h = window.innerHeight;

    renderer = new THREE.WebGLRenderer( {
        antialias: true
    } );
    renderer.setSize( w, h );
    renderer.vr.enabled = true;
    renderer.vr.standing = true;
    document.body.appendChild( renderer.domElement );

    AssetManager.init()
        .then( init )
        .catch( function ( error ) {

            throw Error( error );

        } );

};
