'use strict';

let WebVR = require( '../vr/vr' ).WebVR;

let HTMLUtils = require( '../utils/utils' ).HTMLUtils;

let ModuleManager = require( './module-manager' );
let Controls = require( '../controls/controls' );
let VRControls = Controls.VRControls;
let FPSControls = Controls.FPSControls;

let Control = module.exports;
ModuleManager.registerSystem( 'control', Control );

Control._controls = null;
Control._keyMapping = null;

Control._backgroundDiv = null;

Control.init = function() {

    let renderer = ModuleManager.getRenderer();

    WebVR.checkAvailability()
            .then( function() {
                WebVR.getVRDisplay( function ( display ) {
                    document.body.appendChild(
                        WebVR.getButton( display, renderer.domElement )
                    );
                } );
            } )
            .catch( function( message ) {
                document.body.appendChild( WebVR.getMessageContainer( message ) );
                Control._initKeyboardMouse();
            } );

    //Control.vrControls = new VRControls( camera );

};

Control.update = function( delta ) {
    if ( Control._controls !== null )
        Control._controls.update( delta );
    //Control.vrControls.update();

};

Control.resize = function( params ) {

    let w = params.w;
    let h = params.h;

    Control._controls.resize( w, h );

};

Control._keyDown = function( event ) {

    let key = event.keyCode;
    if ( key in Control._keyMapping && Control._keyMapping[ key ] !== null )
        Control._keyMapping[ event.keyCode ]( true );

};

Control._keyUp = function( event ) {

    let key = event.keyCode;
    if ( key in Control._keyMapping && Control._keyMapping[ key ] !== null )
        Control._keyMapping[ event.keyCode ]( false );

};

Control._mouseMove = function( event ) {

    Control._controls.moveView( event );

};

Control._mouseUp = function() {

};

Control._mouseDown = function() {

};

Control._pointLockChange = function( ) {

    let element = document.body;

    // Pointer has been unlocked
    if ( document.pointerLockElement !== element &&
        document.mozPointerLockElement !== element ) {
        Control._backgroundDiv.style.display = 'block';
        Control._controls.enable( false );
        return;
    }

    Control._backgroundDiv.style.display = 'none';
    Control._controls.enable( true );

};

Control._initKeyboardMouse = function() {

    //container.appendChild( error );
    //document.body.appendChild( container );
    Control._backgroundDiv = HTMLUtils.createFullScreenDiv();
    document.body.appendChild( Control._backgroundDiv );

    let checkPointerLock = 'pointerLockElement' in document ||
                            'mozPointerLockElement' in document ||
                            'webkitPointerLockElement' in document;

    if ( !checkPointerLock ) {
        let displayText = 'your browser does not support pointer locking.';
        displayText += ' If you do not have any VR device and you still want';
        displayText += ' to test ArtFlow with your mouse/keyboard, please';
        displayText += ' tries using a different/newer browser.';
        console.error( 'Controller: ' + displayText );

        let divMsg = 'pointer locking is not activated. Tries to use';
        divMsg += 'a different/newer browser.';

        Control._backgroundDiv.appendChild( HTMLUtils.createCenteredDivMsg( divMsg ) );
        return;
    }

    let sucessMsg = 'Click here to begin!';
    let HTMLButton = HTMLUtils.createCenteredDivMsg( sucessMsg );
    HTMLButton.onclick = function() {

        let element = document.body;
        element.requestPointerLock = element.requestPointerLock ||
                                    element.mozRequestPointerLock ||
                                    element.webkitRequestPointerLock;
        element.exitPointerLock = element.exitPointerLock ||
                                    element.mozExitPointerLock ||
                                    element.webkitExitPointerLock;
        element.requestPointerLock();

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange',
                                    Control._pointLockChange, false );
        document.addEventListener( 'mozpointerlockchange',
                                    Control._pointLockChange, false );

    };
    Control._backgroundDiv.appendChild( HTMLButton );

    let camera = ModuleManager.getCamera();
    Control._controls = new FPSControls( camera );
    Control._controls.enable( false );

    Control._keyMapping = {
        65 /* A */: Control._controls.left.bind( Control._controls ),
        68 /* D */: Control._controls.right.bind( Control._controls ),
        83 /* S */: Control._controls.backward.bind( Control._controls ),
        87 /* W */: Control._controls.forward.bind( Control._controls )
    };

    document.addEventListener( 'keydown', Control._keyDown, false );
    document.addEventListener( 'keyup', Control._keyUp, false );
    document.addEventListener( 'mousemove', Control._mouseMove, false );

};
