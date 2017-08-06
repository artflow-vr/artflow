'use strict';

let THREE = window.THREE;

let ModuleManager = require( './module-manager' );

let View = require( '../view/view' );
let MainView = View.MainView;
let HTMLView = View.HTMLView;
let HTMLTextArea = View.HTMLTextArea;

let Utils = require( '../utils/utils' );
let EventDispatcher = Utils.EventDispatcher;
let MiscInfoTable = Utils.InfoTable.misc;
let AssetManager = Utils.AssetManager;

let Controller = require( '../controller/controller' );
let FPSControls = Controller.FPSControls;
let TeleporterController = Controller.TeleporterController;

let Control = module.exports;
ModuleManager.register( 'control', Control );

Control.vr = false;

/**
 * Maps known command event from keyboard, mouse, or
 * VR Headset controllers to custom Artflow events.
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

    // This variable stores either the direction of the camera if VR
    // is not activated, or the direction of the right controller.
    this._pointerDirection = new THREE.Vector3( 0, 0, -1 );
    this._decompMatrix = new THREE.Matrix4();

    this._teleporterController = new TeleporterController();
    MainView.addToScene( this._teleporterController.getView().getObject() );

    this._controls = null;
    this._vrLeftController = null;
    this._vrRightController = null;

    this._pointerLocked = false;

    this._HTMLView = null;

    // If VR is activated, we will registers other events,
    // display meshes for controllers, etc...
    if ( Control.vr ) {
        Control._initVRControllers();
        Control._registerVREvents();
        Control.update = Control._updateVR;
    } else {
        Control._initKeyboardMouse();
        Control._registerKeyboardMouseEvents();
        Control._registerNONVrEvents();

        Control.update = Control._updateNOVR;
    }

};

Control.resize = function ( params ) {

    let w = params.w;
    let h = params.h;

    Control._controls.resize( w, h );

};

Control._updateVR = function () {

    this._vrLeftController.update();
    this._vrRightController.update();

    this._vrRightController.getWorldDirection( this._pointerDirection );

    this._pointerDirection.x = -this._pointerDirection.x;
    this._pointerDirection.y = -this._pointerDirection.y;
    this._pointerDirection.z = -this._pointerDirection.z;

    this._teleporterController.update(
        this._pointerDirection, this._vrRightController.getWorldPosition()
    );

};

Control._updateNOVR = function ( data ) {

    Control._controls.update( data.delta );

    // Updates the _pointerDirection value with the camera direction.
    MainView.getCamera().getWorldDirection( this._pointerDirection );
    console.log( MainView.getCamera().position );
    this._teleporterController.update(
        this._pointerDirection, MainView.getCamera().position
    );

};

Control._forwardEvent = function ( controlID, controlList,
    eventPrefix = null, data = null ) {

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

Control._registerVREvents = function () {

    this._registerEvents();

};

Control._registerNONVrEvents = function () {

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

    this._registerEvents();

};

Control._registerEvents = function () {

    let self = this;
    let renderer = MainView.getRenderer();

    EventDispatcher.register( 'teleportUp', function () {
        self._teleporterController.enable( false );
        // Teleports the camera at the target position
        let position = self._teleporterController.getTargetPosition();

        let camera = MainView.getCamera();
        camera.position.x = position.x;
        camera.position.z = position.z;

        renderer.vr.getCamera( camera );

    } );
    EventDispatcher.register( 'teleportDown', function () {
        self._teleporterController.enable( true );
    } );

};

Control._initVRControllers = function () {

    let renderer = MainView.getRenderer();
    console.log( renderer );
    let controllerMesh = AssetManager.get( AssetManager.VIVE_CONTROLLER );

    this._vrLeftController = new THREE.ViveController( 0 );
    this._vrLeftController.standingMatrix = renderer.vr.getStandingMatrix();

    this._vrRightController = new THREE.ViveController( 1 );
    this._vrRightController.standingMatrix = renderer.vr.getStandingMatrix();

    this._vrLeftController.add( controllerMesh.clone() );
    this._vrRightController.add( controllerMesh.clone() );

    MainView.addToScene( this._vrRightController );
    MainView.addToScene( this._vrLeftController );

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
