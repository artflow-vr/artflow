'use strict';

window.THREE = require( 'three' );
let THREE = window.THREE;

let Artflow = require( './artflow' );
let ModuleManager = Artflow.modules.ModuleManager;
let ControlModule = Artflow.modules.ControlModule;

let AssetManager = Artflow.utils.AssetManager;

let MainView = Artflow.view.MainView;

let WebVR = Artflow.vr.WebVR;

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

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    update();
    render();

}

function init() {

    clock = new THREE.Clock();

    let w = window.innerWidth;
    let h = window.innerHeight;

    MainView.init( w, h, renderer, ControlModule.vr );
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
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( w, h );
    document.body.appendChild( renderer.domElement );

    AssetManager.init()
        .then( function () {

            WebVR.checkAvailability()
                .then( function () {
                    WebVR.getVRDisplay( function ( display ) {

                        document.body.appendChild(
                            WebVR.getButton( display,
                                renderer.domElement )
                        );
                        renderer.vr.enabled = true;
                        renderer.vr.standing = true;
                        renderer.vr.setDevice( display );

                        ControlModule.vr = true;
                        init();

                    } );

                } )
                .catch( function ( message ) {

                    document.body.appendChild(
                        WebVR.getMessageContainer( message )
                    );
                    init();

                } );

        } )
        .catch( function ( error ) {

            throw Error( error );

        } );

};
