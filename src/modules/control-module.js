'use strict';

let THREE = window.THREE;

// ViveController is auto-added to the THREE namespace.
require( '../../vendor/ViveController' );

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

Control.vr = false;

/**
 * Maps known command event from keyboard, mouse, or
 * VR Headset controllers to custom Artflow events.
 * This structure allows to use a single pipeline for all actions.
 */
Control._mouseToAction = {
    0: EventDispatcher.EVENTS.interact, // Left click
    2: EventDispatcher.EVENTS.teleport // Right click
};

Control._controllerToAction = {
    thumbpad: EventDispatcher.EVENTS.teleport
};

Control.init = function () {

    // This variable stores either the direction of the camera if VR
    // is not activated, or the direction of the controller which pressed
    // the teleport button.
    this._pointerDirection = new THREE.Vector3( 0, 0, -1 );

    this._teleporterController = new TeleporterController();
    MainView.addToScene( this._teleporterController.getView().getObject() );

    this._fpsController = null;
    this._controllers = null;
    this._currentController = null;

    this._pointerLocked = false;

    this._HTMLView = null;

    // If VR is activated, we will registers other events,
    // display meshes for controllers, etc...
    if ( Control.vr ) {
        Control._initVRControllers();
        Control._registerControllerEvents();
        Control.update = Control._updateVR;
    } else {
        Control._initKeyboardMouse();
        Control._registerKeyboardMouseEvents();
        Control.update = Control._updateNOVR;
    }

    this._registerEvents();

};

Control.resize = function ( params ) {

    let w = params.w;
    let h = params.h;

    if ( this._fpsController )
        Control._fpsController.resize( w, h );

};

Control._updateVR = function () {

    this._controllers[ 0 ].update();
    this._controllers[ 1 ].update();

    if ( this._currentController === null ) return;

    this._currentController.getWorldDirection( this._pointerDirection );

    this._pointerDirection.x = -this._pointerDirection.x;
    this._pointerDirection.y = -this._pointerDirection.y;
    this._pointerDirection.z = -this._pointerDirection.z;

    this._teleporterController.update(
        this._pointerDirection, this._currentController.getWorldPosition()
    );

};

Control._updateNOVR = function ( data ) {

    Control._fpsController.update( data.delta );

    // Updates the _pointerDirection value with the camera direction.
    MainView.getCamera().getWorldDirection( this._pointerDirection );
    this._teleporterController.update(
        this._pointerDirection, MainView.getCamera().getWorldPosition()
    );

};

Control._mouseMove = function ( event ) {

    Control._fpsController.moveView( event );

};

Control._pointLockChange = function () {

    Control._pointerLocked = !Control._pointerLocked;

    Control._HTMLView.toggleVisibility( !Control._pointerLocked );
    Control._fpsController.enable( Control._pointerLocked );

};

/**
 * Registers events common to any control type: mouse, keyboard, controllers...
 * e.g; teleportUp / teleportDown.
 */
Control._registerEvents = function () {

    let self = this;

    let teleportUp = EventDispatcher.EVENTS.teleport + 'Up';
    let teleportDown = EventDispatcher.EVENTS.teleport + 'Down';

    EventDispatcher.register( teleportUp, function () {

        self._teleporterController.enable( false );

        // It is really painful to keep track of offset on camera to apply on
        // controllers, teleporter mesh, etc...
        // That's why we decided that, instead to move the camera in the world,
        // we could move the world arround the camera.
        let position = self._teleporterController.getTargetPosition();
        let direction = new THREE.Vector3();

        direction.subVectors( MainView.getCamera().getWorldPosition(),
            position );

        MainView.getGroup().position.x += direction.x;
        MainView.getGroup().position.z += direction.z;

        self._currentController = null;

    } );

    EventDispatcher.register( teleportDown, function () {
        self._teleporterController.enable( true );

    } );

};

/**
 * Creates both controllers, assign them the Vive Controller mesh, and adds
 * them to the scene.
 */
Control._initVRControllers = function () {

    let renderer = MainView.getRenderer();
    let controllerMesh = AssetManager.get( AssetManager.VIVE_CONTROLLER );

    this._controllers = new Array( 2 );
    this._controllers[ 0 ] = new THREE.ViveController( 0 );
    this._controllers[ 0 ].standingMatrix = renderer.vr.getStandingMatrix();

    this._controllers[ 1 ] = new THREE.ViveController( 1 );
    this._controllers[ 1 ].standingMatrix = renderer.vr.getStandingMatrix();

    this._controllers[ 0 ].add( controllerMesh.clone() );
    this._controllers[ 1 ].add( controllerMesh.clone() );

    MainView.addToScene( this._controllers[ 0 ] );
    MainView.addToScene( this._controllers[ 1 ] );

};

Control._registerControllerEvents = function () {

    let self = this;

    this._controllers[ 0 ].addEventListener( 'thumbpad', function ( data ) {

        self._currentController = self._controllers[ 0 ];
        let eventID = Control._controllerToAction.thumbpad + data.status;
        EventDispatcher.dispatch( eventID );

    } );
    this._controllers[ 1 ].addEventListener( 'thumbpad', function ( data ) {

        self._currentController = self._controllers[ 1 ];
        let eventID = Control._controllerToAction.thumbpad + data.status;
        EventDispatcher.dispatch( eventID );

    } );

};

Control._initKeyboardMouse = function () {

    let camera = MainView.getCamera();

    this._fpsController = new FPSControls( camera );
    this._fpsController.enable( false );
    this._fpsController.setFixedHeight( 1.5 );

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
        let eventID = self._mouseToAction[ event.button ];
        EventDispatcher.dispatch( eventID + 'Down' );
    }, false );
    document.addEventListener( 'mouseup', function ( event ) {
        let eventID = self._mouseToAction[ event.button ];
        EventDispatcher.dispatch( eventID + 'Up' );
    }, false );

    // The events below are different, we do not really need
    // to create a forwarding as it differs from the other devices,
    // and also because it does not make sense to change the binding.

    document.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
        case 65:
            self._fpsController.left( true );
            break; // A
        case 68:
            self._fpsController.right( true );
            break; // D
        case 83:
            self._fpsController.backward( true );
            break; // S
        case 87:
            self._fpsController.forward( true );
            break; // W
        case 90:
            self._fpsController.forward( true );
            break; // Z
        }
    }, false );
    document.addEventListener( 'keyup', function ( event ) {
        switch ( event.keyCode ) {
        case 65:
            self._fpsController.left( false );
            break; // A
        case 68:
            self._fpsController.right( false );
            break; // D
        case 83:
            self._fpsController.backward( false );
            break; // S
        case 87:
            self._fpsController.forward( false );
            break; // W
        case 90:
            self._fpsController.forward( false );
            break; // Z
        }
    }, false );

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
