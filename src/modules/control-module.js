'use strict';

let THREE = window.THREE;

// ViveController is auto-added to the THREE namespace.
require( '../../vendor/ViveController' );

let MainView = require( '../view/main-view' );

let Utils = require( '../utils/utils' );
let EventDispatcher = Utils.EventDispatcher;
let MiscInfoTable = Utils.InfoTable.misc;
let AssetManager = Utils.AssetManager;

let Controller = require( '../controller/controller' );
let FPSControls = Controller.FPSControls;

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
    thumbpad: EventDispatcher.EVENTS.teleport,
    trigger: EventDispatcher.EVENTS.interact,
    triggerdown: EventDispatcher.EVENTS.interact + 'Down',
    triggerup: EventDispatcher.EVENTS.interact + 'Up'
};

Control.init = function () {

    // This variable stores either the direction of the camera if VR
    // is not activated, or the direction of the controller which pressed
    // the teleport button.
    this._pointerDirection = new THREE.Vector3( 0, 0, -1 );

    this._controllerTransform = new Array( 2 );
    this._controllerTransform[ 0 ] = {
        position: {
            local: new THREE.Vector3( 0, 0, 0 ),
            world: new THREE.Vector3( 0, 0, 0 )
        },
        orientation: new THREE.Quaternion()
    };
    this._controllerTransform[ 1 ] = {
        position: {
            local: new THREE.Vector3( 0, 0, 0 ),
            world: new THREE.Vector3( 0, 0, 0 )
        },
        orientation: new THREE.Quaternion()
    };

    this._fpsController = null;
    this._controllers = null;
    this._currentController = null;

    this._mouseUseEvent = null;
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
        MainView.getCamera().position.y = 1.5;
        MainView.backgroundView.toggleVisibility( true );
    }

};

Control._updateVR = function () {

    this._controllers[ 0 ].update();
    this._controllers[ 1 ].update();

    // Keeps track of controllers orientation
    // relative to the world origin.
    this._controllers[ 0 ].getWorldQuaternion(
        this._controllerTransform[ 0 ].orientation
    );
    this._controllers[ 1 ].getWorldQuaternion(
        this._controllerTransform[ 1 ].orientation
    );

    // Keeps track of controllers position
    // relative to the world origin.
    let position0 = this._controllerTransform[ 0 ].position;
    let position1 = this._controllerTransform[ 1 ].position;

    this._controllers[ 0 ].getWorldPosition( position0.local );
    position0.world.copy( position0.local );
    position0.world.x -= MainView.getGroup().position.x;
    position0.world.z -= MainView.getGroup().position.z;

    this._controllers[ 1 ].getWorldPosition( position1.local );
    position1.world.copy( position1.local );
    position1.world.x -= MainView.getGroup().position.x;
    position1.world.z -= MainView.getGroup().position.z;

};

Control._updateNOVR = function ( data ) {

    Control._fpsController.update( data.delta );

    if ( this._mouseUseEvent ) {
        // Updates the _pointerDirection value with the camera direction.
        let orientation = this._controllerTransform[ 0 ].orientation;
        MainView.getCamera().getWorldQuaternion( orientation );

        let position = this._controllerTransform[ 0 ].position;
        if ( this._mouseUseEvent === EventDispatcher.EVENTS.interact ) {
            MainView.getCamera().getWorldDirection( this._pointerDirection );
            position.local.copy( this._pointerDirection );
            position.local.multiplyScalar( 5.0 );
        } else {
            MainView.getCamera().getWorldPosition( position.local );
        }

        position.world.copy( position.local );
        position.world.x -= MainView.getGroup().position.x;
        position.world.z -= MainView.getGroup().position.z;

        EventDispatcher.dispatch( this._mouseUseEvent, {
            controllerID: 0,
            position: {
                local: position.local,
                world: position.world
            },
            orientation: orientation
        } );
    }

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

    let registerEventForController = function ( cID, evt ) {

        self._controllers[ cID ].addEventListener( evt, function ( data ) {

            let eventID = Control._controllerToAction[ evt ];
            if ( data.status )
                eventID += data.status;

            self._currentController = self._controllers[ cID ];

            EventDispatcher.dispatch( eventID, {
                controllerID: cID,
                position: self._controllerTransform[
                    cID ].position,
                orientation: self._controllerTransform[
                    cID ].orientation
            } );

        } );

    };

    registerEventForController( 0, 'thumbpad' );
    registerEventForController( 1, 'thumbpad' );

    registerEventForController( 0, 'trigger' );
    registerEventForController( 1, 'trigger' );
    registerEventForController( 0, 'triggerup' );
    registerEventForController( 1, 'triggerup' );
    registerEventForController( 0, 'triggerdown' );
    registerEventForController( 1, 'triggerdown' );

};

Control._initKeyboardMouse = function () {

    let camera = MainView.getCamera();

    this._fpsController = new FPSControls( camera, MainView.getGroup() );
    this._fpsController.fixedHeight = true;
    this._fpsController.enabled = false;

    let checkPointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    let clickView = MainView.clickView;
    if ( !checkPointerLock ) {
        clickView.setMessage( MiscInfoTable.missingPointerLocking );
        return;
    }

    // Hooks pointer lock state change events
    let pointLockEvent = function () {

        Control._pointerLocked = !Control._pointerLocked;

        MainView.backgroundView.toggleVisibility( !Control._pointerLocked );
        Control._fpsController.enabled = Control._pointerLocked;

    };
    document.addEventListener( 'pointerlockchange', pointLockEvent, false );
    document.addEventListener( 'mozpointerlockchange', pointLockEvent,
        false );

    clickView.setMessage( MiscInfoTable.startPointerLocking );
    clickView.setProp( 'onclick', function () {

        let element = document.body;
        element.requestPointerLock = element.requestPointerLock ||
            element.mozRequestPointerLock ||
            element.webkitRequestPointerLock;
        element.exitPointerLock = element.exitPointerLock ||
            element.mozExitPointerLock ||
            element.webkitExitPointerLock;
        element.requestPointerLock();

    } );

};

Control._registerKeyboardMouseEvents = function () {

    let self = this;

    document.addEventListener( 'mousedown', function ( event ) {
        let eventID = self._mouseToAction[ event.button ];
        self._mouseUseEvent = eventID;
        EventDispatcher.dispatch( eventID + 'Down', {
            controllerID: 0
        } );
    }, false );
    document.addEventListener( 'mouseup', function ( event ) {
        let eventID = self._mouseToAction[ event.button ];
        self._mousedown = false;
        self._mouseUseEvent = null;
        EventDispatcher.dispatch( eventID + 'Up', {
            controllerID: 0
        } );
    }, false );

    // The events below are different, we do not really need
    // to create a forwarding as it differs from the other devices,
    // and also because it does not make sense to change the binding.
    document.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
        case 49: // TODO: To remove (only for debug)
            EventDispatcher.dispatch( EventDispatcher.EVENTS.undo );
            break;
        case 50: // TODO: To remove (only for debug)
            EventDispatcher.dispatch( EventDispatcher.EVENTS.redo );
            break;
        case 65:
            self._fpsController.left = true;
            break; // A
        case 68:
            self._fpsController.right = true;
            break; // D
        case 83:
            self._fpsController.backward = true;
            break; // S
        case 87:
            self._fpsController.forward = true;
            break; // W
        case 90:
            self._fpsController.forward = true;
            break; // Z
        }
    }, false );
    document.addEventListener( 'keyup', function ( event ) {
        switch ( event.keyCode ) {
        case 65:
            self._fpsController.left = false;
            break; // A
        case 68:
            self._fpsController.right = false;
            break; // D
        case 83:
            self._fpsController.backward = false;
            break; // S
        case 87:
            self._fpsController.forward = false;
            break; // W
        case 90:
            self._fpsController.forward = false;
            break; // Z
        }
    }, false );

    document.addEventListener( 'mousemove', function () {

        Control._fpsController.moveView( event );

    }, false );

};
