let Main = module.exports;

let THREE = window.THREE = require( 'three' );

let Artflow = require( './artflow' );
let ModuleManager = Artflow.modules.ModuleManager;
let ControlModule = Artflow.modules.ControlModule;

let AssetManager = Artflow.utils.AssetManager;

let MainView = Artflow.view.MainView;

let WebVR = Artflow.vr.WebVR;

let renderer = null;
let clock = null;

let updateData = {
    delta: 0.0,
    controllers: [ null, null ]
};

Main.init = function ( w, h ) {

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
                        Main._initData( w, h );

                    } );

                } )
                .catch( function ( message ) {

                    document.body.appendChild(
                        WebVR.getMessageContainer( message )
                    );
                    Main._initData( w, h );

                } );

        } )
        .catch( function ( error ) {

            throw Error( error );

        } );


};

Main.resize = function ( w, h ) {

    ModuleManager.resize( w, h );
    MainView.resize( w, h );
    renderer.setSize( w, h );

};

Main._update = function () {

    let controllers = ControlModule.getControllersData();

    updateData.delta = clock.getDelta();
    updateData.controllers[ 0 ] = controllers[ 0 ];
    updateData.controllers[ 1 ] = controllers[ 1 ];

    ModuleManager.update( updateData );

};

Main._render = function () {

    MainView.render();

};

Main._animate = function () {

    Main._update();
    Main._render();

};

Main._initData = function ( w, h ) {

    clock = new THREE.Clock();

    MainView.init( w, h, renderer, ControlModule.vr );
    ModuleManager.init();

    Main.resize( w, h );
    renderer.animate( Main._animate );

};
