'use strict';

let ModuleManager = require( './module-manager' );

let viewNamespace = require( '../view/view' );
let MainView = viewNamespace.MainView;
let HTMLView = viewNamespace.HTMLView;
let HTMLTextArea = viewNamespace.HTMLTextArea;

let MiscInfoTable = require( '../utils/info-table' ).misc;
let VRInfoTable = require( '../utils/info-table' ).vr;

let WebVR = require( '../vr/vr' ).WebVR;

let Controls = require( '../controls/controls' );
let VRControls = Controls.VRControls;
let FPSControls = Controls.FPSControls;

let Control = module.exports;
ModuleManager.register( 'control', Control );

Control._controls = null;
Control._keyMapping = null;
Control._HTMLView = null;
Control._pointerLocked = false;

Control.init = function() {

    let renderer = MainView.getRenderer();

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

Control.update = function( data ) {

    if ( Control._controls !== null )
        Control._controls.update( data.delta );
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

    Control._pointerLocked = !Control._pointerLocked;

    Control._HTMLView.toggleVisibility( !Control._pointerLocked );
    Control._controls.enable( Control._pointerLocked );

};

Control._initKeyboardMouse = function() {

    Control._controls = null;
    Control._keyMapping = null;

    let camera = MainView.getCamera();

    let backgroundStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: '0px',
        backgroundColor: 'rgba(44, 62, 80, 0.98)'
    };
    let messageViewStyle = {
        position: 'relative',
        top: '50%'
    };

    Control._HTMLView = new HTMLView( backgroundStyle );
    let messageView = new HTMLTextArea( null, messageViewStyle );

    Control._HTMLView.setProp( 'align', 'center' );

    let checkPointerLock = 'pointerLockElement' in document ||
                            'mozPointerLockElement' in document ||
                            'webkitPointerLockElement' in document;

    document.body.appendChild( Control._HTMLView.getDOMElement() );
    Control._HTMLView.addChild( messageView );

    if ( !checkPointerLock ) {
        messageView.setMessage( MiscInfoTable.missingPointerLocking );
        return;
    }

    messageView.setMessage( MiscInfoTable.startPointerLocking );
    messageView.setProp( 'onclick', function() {

        let element = document.body;
        element.requestPointerLock = element.requestPointerLock ||
                                    element.mozRequestPointerLock ||
                                    element.webkitRequestPointerLock;
        element.exitPointerLock = element.exitPointerLock ||
                                    element.mozExitPointerLock ||
                                    element.webkitExitPointerLock;
        element.requestPointerLock();

        // Hooks pointer lock state change events
        document.addEventListener( 'pointerlockchange',
                                    Control._pointLockChange, false );
        document.addEventListener( 'mozpointerlockchange',
                                    Control._pointLockChange, false );

    } );

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
