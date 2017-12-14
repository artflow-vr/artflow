/**
* ArtFlow application
* https://github.com/artflow-vr/artflow
*
* MIT License
*
* Copyright (c) 2017 artflow
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import * as Utils from '../utils/utils';
import * as Controller from '../controller/controller';
import UI from '../view/ui';
import MainView from '../view/main-view';

let EventDispatcher = Utils.EventDispatcher;
let MiscInfoTable = Utils.InfoTable.misc;
let AssetManager = Utils.AssetManager;

let FPSControls = Controller.FPSControls;
let ViveController = Controller.ViveController;

const ACTIONS = {
    trigger: 'interact'
};

/**
 * Maps known command event from keyboard, mouse, or VR Headset controllers
 * to custom Artflow events. This structure allows to use a single pipeline
 * for all actions.
 */
const MOUSE_TO_ACTION = {
    0: 'interact', // Left click
    2: 'thumbpad' // Right click
};

const CONTROLLER_TO_ACTION = {
    thumbpad: 'thumbpad',
    trigger: 'interact',
    triggerdown: 'interactDown',
    triggerup: 'interactUp',
    axisChanged: 'axisChanged',
    menu: 'menu'
};

class Control {

    constructor( ) {

        this.vr = false;

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
        this._controllerTransform[ 1 ] = Object.assign(
            {}, this._controllerTransform[ 0 ]
        );

        this._fpsController = null;
        this._controllers = null;
        this._currentController = null;

        this._mouseUseEvent = null;
        this._pointerLocked = false;

        this._HTMLView = null;

    }

    init( vr ) {

        // Creates the UI and add initial offsets.
        // The UI will grow when new item will be registered.
        let uiTextures = {
            background: AssetManager.assets.texture[ 'ui-background' ],
            home: AssetManager.assets.texture[ 'ui-home' ],
            arrowLeft: AssetManager.assets.texture[ 'ui-arrow-left' ],
            buttonBackground: AssetManager.assets.texture[ 'ui-button-back' ],
            buttonHover: AssetManager.assets.texture[ 'ui-button-hover' ],
            colorWheel: AssetManager.assets.texture[ 'ui-color-wheel' ],
            slider: AssetManager.assets.texture[ 'ui-slider' ],
            sliderButton: AssetManager.assets.texture[ 'ui-slider-button' ]
        };

        this.vr = vr;
        // If VR is activated, we will registers other events,
        // display meshes for controllers, etc...
        if ( this.vr ) {
            this._updateBody = this._updateVR;
            this._initVRControllers();
            this._registerControllerEvents();
            UI.init( uiTextures, this._controllers );
        } else {
            this._updateBody = this._updateNOVR;
            this._initKeyboardMouse();
            this._registerKeyboardMouseEvents();
            MainView.getCamera().position.y = 1.5;
            MainView.backgroundView.toggleVisibility( true );
            UI.init( uiTextures, null );
        }
        this._initUI( this.vr );

    }

    update( data ) {

        // Updates the UI inputs
        UI.update();

        // Updates:
        // VR: Controllers, controller events, etc...
        // NON-VR: FPS Camera, mouse orientation, etc...
        this._updateBody( data );

    }

    getControllersData() {

        return this._controllerTransform;

    }

    _updateVR() {

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

    }

    _updateNOVR( data ) {

        this._fpsController.update( data.delta );

        this._computeMouseOrientation();
        this._computeMouseLocalWorldPosition();

        if ( this._mouseUseEvent ) {
            EventDispatcher.dispatch( this._mouseUseEvent, {
                controllerID: 0,
                position: this._controllerTransform[ 0 ].position,
                orientation: this._controllerTransform[ 0 ].orientation,
                pressure: 0.5
            } );
        }

    }

    _initUI( vr ) {

        if ( !vr ) {
            let callback = () => {
                return !UI.hover;
            };
            EventDispatcher.registerFamily( ACTIONS.trigger, {
                use: callback,
                trigger: callback,
                release: callback
            }, 0 );

            return;
        }

        // This callback is in charge of stopping event propagation
        // if the UI intercept input events.
        let callback = ( pressed ) => {
            if ( UI.hover ) {
                UI.setPressed( pressed );
                return false;
            }
            return true;
        };
        let triggerCallback = callback.bind( true );
        let releaseCallback = callback.bind( false );

        // We will put the events on the UI as the most important event.
        // UI events have priority 0, meaning they are executed first and
        // can stop propagation to others.
        EventDispatcher.registerFamily( ACTIONS.trigger, {
                use: triggerCallback,
                trigger: triggerCallback,
                release: releaseCallback
            }, 0
        );

    }

    _initVRControllers() {

        let renderer = MainView.getRenderer();
        let controllerMesh = AssetManager.assets.model[ 'vive-controller' ];
        controllerMesh.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh && child.name !== 'tip' ) {
                child.material.map = AssetManager.assets.texture[ 'controller-diffuse' ];
                child.material.specularMap = AssetManager.assets.texture[ 'controller-specular' ];
                child.material.needsUpdate = true;
            }

        } );

        this._controllers = new Array( 2 );

        // Makes copy of certain materials / meshes.
        // This allows us to modify for instance the color of the current
        // controller using the UI, etc...
        let meshes = [ controllerMesh.clone(), controllerMesh.clone() ];
        for ( let i = 0; i < 2; ++i ) {
            let tipMat = null;
            meshes[ i ].traverse( ( child ) => {

                if ( child.name === 'tip' ) {
                    child.material = child.material.clone();
                    tipMat = child.material;
                }

            } );
            meshes[ i ].traverse( ( child ) => {

                if ( child.name === 'sizehint' )
                    child.material = tipMat;

            } );

            let viveController = new ViveController( i, meshes[ i ] );
            viveController.standingMatrix = renderer.vr.getStandingMatrix();
            this._controllers[ i ] = viveController;
            MainView.addToScene( this._controllers[ i ] );
        }

    }

    _registerControllerEvents() {

        let self = this;


        let registerEventForController = ( cID, evt ) => {

            self._controllers[ cID ].addEventListener( evt, function ( data ) {

                let eventID = CONTROLLER_TO_ACTION[ evt ];
                if ( data.status )
                    eventID += data.status;

                self._currentController = self._controllers[ cID ];

                EventDispatcher.dispatch( eventID, {
                    controller: self._currentController,
                    controllerID: cID,
                    position: self._controllerTransform[ cID ].position,
                    orientation: self._controllerTransform[ cID ].orientation,
                    pressure: data.pressure,
                    axis: data.axes
                } );

            } );

        };

        // We start by registering events on both controllers. We will
        // use the event dispatcher of Three.js, that will call our
        // dispatcher to send global events.
        for ( let elt in CONTROLLER_TO_ACTION ) {
            registerEventForController( 0, elt );
            registerEventForController( 1, elt );
        }

        // We can start to listen to the menu event, which is not related
        // to any tool.
        EventDispatcher.register( ACTIONS.menu + 'Down', ( data ) => {
                UI.triggerShow( data.controllerID );
        } );

    }

    _initKeyboardMouse() {

        let camera = MainView.getCamera();

        this._fpsController = new FPSControls( camera, MainView.getGroup() );
        this._fpsController.fixedHeight = false;
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
        let pointLockEvent = () => {

            this._pointerLocked = !this._pointerLocked;

            MainView.backgroundView.toggleVisibility( !this._pointerLocked );
            this._fpsController.enabled = this._pointerLocked;

        };
        document.addEventListener( 'pointerlockchange', pointLockEvent, false );
        document.addEventListener( 'mozpointerlockchange',
                                        pointLockEvent, false );

        clickView.setMessage( MiscInfoTable.startPointerLocking );
        clickView.setProp( 'onclick', () => {

            let element = document.body;
            element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
            element.exitPointerLock = element.exitPointerLock ||
                element.mozExitPointerLock ||
                element.webkitExitPointerLock;
            element.requestPointerLock();

        } );

    }

    _registerKeyboardMouseEvents() {

        document.addEventListener( 'mousedown', ( event ) => {

            let eventID = MOUSE_TO_ACTION[ event.button ];
            this._mouseUseEvent = eventID;

            EventDispatcher.dispatch( eventID + 'Down', {
                controllerID: 0,
                position: this._controllerTransform[ 0 ].position,
                orientation: this._controllerTransform[ 0 ].orientation,
                pressure: 0.5
            } );

        }, false );
        document.addEventListener( 'mouseup', ( event ) => {

            let eventID = MOUSE_TO_ACTION[ event.button ];
            this._mousedown = false;
            this._mouseUseEvent = null;

            EventDispatcher.dispatch( eventID + 'Up', {
                controllerID: 0,
                position: this._controllerTransform[ 0 ].position,
                orientation: this._controllerTransform[ 0 ].orientation,
                pressure: 0.5
            } );

        }, false );

        // The events below are different, we do not really need
        // to create a forwarding as it differs from the other devices,
        // and also because it does not make sense to change the binding.
        document.addEventListener( 'keydown', ( event ) => {
            switch ( event.keyCode ) {
                case 49: // TODO: To remove (only for debug)
                    EventDispatcher.dispatch( 'undo' );
                    break;
                case 50: // TODO: To remove (only for debug)
                    EventDispatcher.dispatch( 'redo' );
                    break;
                case 65:
                case 81:
                    this._fpsController.left = true;
                    break; // A
                case 68:
                    this._fpsController.right = true;
                    break; // D
                case 83:
                    this._fpsController.backward = true;
                    break; // S
                case 87:
                    this._fpsController.forward = true;
                    break; // W
                case 90:
                    this._fpsController.forward = true;
                    break; // Z
            }
        }, false );

        document.addEventListener( 'keyup', ( event ) => {

            switch ( event.keyCode ) {
                case 65:
                case 81:
                    this._fpsController.left = false;
                    break; // A
                case 68:
                    this._fpsController.right = false;
                    break; // D
                case 83:
                    this._fpsController.backward = false;
                    break; // S
                case 87:
                    this._fpsController.forward = false;
                    break; // W
                case 90:
                    this._fpsController.forward = false;
                    break; // Z
            }
        }, false );

        document.addEventListener( 'mousemove', ( event ) => {

            this._fpsController.moveView( event );

        }, false );

    }

    _computeMouseOrientation() {

        let orientation = this._controllerTransform[ 0 ].orientation;
        MainView.getCamera().getWorldQuaternion( orientation );

    }

    _computeMouseLocalWorldPosition() {

        let position = this._controllerTransform[ 0 ].position;
        if ( this._mouseUseEvent === 'interact' ) {
            MainView.getCamera().getWorldDirection( this._pointerDirection );
            position.local.copy( this._pointerDirection );
            position.local.multiplyScalar( 3.0 );
        } else {
            MainView.getCamera().getWorldPosition( position.local );
        }

        position.world.copy( position.local );
        position.world.x -= MainView.getGroup().position.x;
        position.world.y -= MainView.getGroup().position.y;
        position.world.z -= MainView.getGroup().position.z;

    }

}

export default new Control();
