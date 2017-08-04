'use strict';

let ModuleManager = require( './module-manager' );

let viewNamespace = require( '../view/view' );
let MainView = viewNamespace.MainView;
let HTMLView = viewNamespace.HTMLView;
let HTMLTextArea = viewNamespace.HTMLTextArea;

let Utils = require( '../utils/utils' );
let EventDispatcher = Utils.EventDispatcher;
let MiscInfoTable = Utils.InfoTable.misc;

let WebVR = require( '../vr/vr' ).WebVR;

let Controls = require( '../controls/controls' );
//let VRControls = Controls.VRControls;
let FPSControls = Controls.FPSControls;

let Control = module.exports;
ModuleManager.register( 'control', Control );

/**
 * Maps known command event from keyboard, mouse, or
 * VR Headset controllers to custom Artflow event.
 * This structure allows to use a single pipeline for all actions.
 */
Control._keyboardToAction = {
    65: 'left', // A
    68: 'right', // D
    83: 'backward', // S
    87: 'forward', // W
    90: 'forward' // Z
};

Control._mouseToAction = {
    0: 'interact', // Left click
    2: 'teleport' // Right click
};

Control.init = function () {

    this._controls = null;
    this._keyMapping = null;
    this._HTMLView = null;
    this._pointerLocked = false;

    let renderer = MainView.getRenderer();

    WebVR.checkAvailability()
        .then( function () {
            WebVR.getVRDisplay( function ( display ) {
                document.body.appendChild(
                    WebVR.getButton( display, renderer.domElement )
                );
                renderer.vr.setDevice( display );
            } );
        } )
        .catch( function ( message ) {
            document.body.appendChild( WebVR.getMessageContainer(
                message ) );
            Control._initKeyboardMouse();
            Control._registerKeyboardMouseEvents();
            Control._createEventsHandler();
        } );

    //Control.vrControls = new VRControls( camera );

};

Control.update = function ( data ) {

    if ( Control._controls !== null )
        Control._controls.update( data.delta );
    //Control.vrControls.update();

};

Control.resize = function ( params ) {

    let w = params.w;
    let h = params.h;

    Control._controls.resize( w, h );

};

Control._forwardEvent = function ( controlID, controlList, eventPrefix = null,
    data = null ) {

    if ( !( controlID in controlList ) ) return;

    let eventID = controlList[ controlID ];
    if ( eventPrefix === null )
        EventDispatcher.dispatch( eventID, data );
    else
        EventDispatcher.dispatch( eventID + eventPrefix, data );

};

Control._mouseMove = function ( event ) {

    Control._controls.moveView( event );

};

Control._pointLockChange = function () {

    Control._pointerLocked = !Control._pointerLocked;

    Control._HTMLView.toggleVisibility( !Control._pointerLocked );
    Control._controls.enable( Control._pointerLocked );

};

Control._createEventsHandler = function () {

    let self = this;

    //
    // Handles Left, Right, Up,  Down moves, useful
    // when VR Controllers has not been detected.
    //
    EventDispatcher.register( 'leftDown', function () {
        self._controls.left( true );
    } );
    EventDispatcher.register( 'leftUp', function () {
        self._controls.left( false );
    } );
    EventDispatcher.register( 'rightDown', function () {
        self._controls.right( true );
    } );
    EventDispatcher.register( 'rightUp', function () {
        self._controls.right( false );
    } );
    EventDispatcher.register( 'backwardDown', function () {
        self._controls.backward( true );
    } );
    EventDispatcher.register( 'backwardUp', function () {
        self._controls.backward( false );
    } );
    EventDispatcher.register( 'forwardDown', function () {
        self._controls.forward( true );
    } );
    EventDispatcher.register( 'forwardUp', function () {
        self._controls.forward( false );
    } );

};

Control._initKeyboardMouse = function () {

    let camera = MainView.getCamera();

    this._controls = null;
    this._keyMapping = null;
    this._controls = new FPSControls( camera );
    this._controls.enable( false );
    this._controls.setFixedHeight( 2.0 );

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

    this._HTMLView = new HTMLView( backgroundStyle );
    this._HTMLView.setProp( 'align', 'center' );

    let messageView = new HTMLTextArea( null, messageViewStyle );

    let checkPointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    document.body.appendChild( Control._HTMLView.getDOMElement() );
    this._HTMLView.addChild( messageView );

    if ( !checkPointerLock ) {
        messageView.setMessage( MiscInfoTable.missingPointerLocking );
        return;
    }

    messageView.setMessage( MiscInfoTable.startPointerLocking );
    messageView.setProp( 'onclick', Control._initPointerLock );

};

Control._registerKeyboardMouseEvents = function () {

    let self = this;

    document.addEventListener( 'mousedown', function ( event ) {
        self._forwardEvent( event.button, self._mouseToAction,
            'Down' );
    }, false );
    document.addEventListener( 'mouseup', function ( event ) {
        self._forwardEvent( event.button, self._mouseToAction, 'Up' );
    }, false );

    document.addEventListener( 'keydown', function ( event ) {
        self._forwardEvent( event.keyCode, self._keyboardToAction,
            'Down' );
    }, false );
    document.addEventListener( 'keyup', function ( event ) {
        self._forwardEvent( event.keyCode, self._keyboardToAction,
            'Up' );
    }, false );

    // The events below are different, we do not really need
    // to create a forwarding as it differs from the other devices,
    // and also because it does not make sense to change the binding.
    document.addEventListener( 'mousemove', this._mouseMove, false );
};

Control._initPointerLock = function () {

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

};
