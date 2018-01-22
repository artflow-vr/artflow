/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 * Original file can be found at https://github.com/mrdoob/three.js/blob/dev/examples/js/vr/ViveController.js
 */

import MathUtils from '../utils/math';

const MIN_SIZE_SELECTION = 0.25;
const MAX_SIZE_SELECTION = 1.5;
const SIZE_SCALE_SPEED = 0.15;

const GLOW = [
    new THREE.Color( 0.0, 0.0, 0.0 ),
    new THREE.Color( 52.0 / 255.0, 152.0 / 255.0, 219.0 / 255.0 )
];
const GLOW_TIME = 0.65;

export default class ViveController extends THREE.Object3D {

    constructor( id, mesh ) {

        super();

        this.add( mesh );
        // Keeps references to part of meshes to change them according
        // to the inputs.
        this.sizeMesh = null;
        for ( let i = 0; i < mesh.children.length; ++i ) {
            if ( mesh.children[ i ].name === 'sizehint' ) {
                this.sizeMesh = mesh.children[ i ];
                break;
            }
        }

        this._gamepadID = id;
        this._gamepad = null;

        this.standingMatrix = new THREE.Matrix4();
        this.matrixAutoUpdate = false;

        this._axesDiff = new Array( 2 );

        this.glow = {
            delta: 0.0,
            meshes: [],
            target: 1
        };

        let self = this;
        this.userData.vrui = {};
        this.userData.vrui.pressed = false;

        this.buttons = {
            thumbpad: {
                pressed: false,
                axes: [ 0, 0 ],
                triggerEvent() {
                    let axes = self._gamepad.axes;
                    let val = self.buttons.thumbpad.axes;
                    if ( val[ 0 ] !== axes[ 0 ] || val[ 1 ] !==
                        axes[ 1 ] ) {
                        self._axesDiff[ 0 ] = axes[ 0 ] - val[ 0 ];
                        self._axesDiff[ 1 ] = axes[ 1 ] - val[ 1 ];
                        self.dispatchEvent( {
                            type: 'axisChanged',
                            axes: self._axesDiff
                        } );

                        self.buttons.thumbpad.axes[ 0 ] = axes[ 0 ];
                        self.buttons.thumbpad.axes[ 1 ] = axes[ 1 ];

                        // Scales the size mesh accordingly
                        if ( Math.abs( self._axesDiff[ 1 ] ) < 0.5 ) {
                            let sx = self.sizeMesh.scale.x + self._axesDiff[ 1 ] * SIZE_SCALE_SPEED;
                            let sy = self.sizeMesh.scale.y + self._axesDiff[ 1 ] * SIZE_SCALE_SPEED;
                            let sz = self.sizeMesh.scale.z + self._axesDiff[ 1 ] * SIZE_SCALE_SPEED;
                            self.sizeMesh.scale.x =
                                MathUtils.clamp( MIN_SIZE_SELECTION, MAX_SIZE_SELECTION, sx );
                            self.sizeMesh.scale.y =
                                MathUtils.clamp( MIN_SIZE_SELECTION, MAX_SIZE_SELECTION, sy );
                            self.sizeMesh.scale.z =
                                MathUtils.clamp( MIN_SIZE_SELECTION, MAX_SIZE_SELECTION, sz );
                        }

                    }
                    self._triggerBoolButton(
                        'thumbpad',
                        self._gamepad.buttons[ 0 ].pressed
                    );

                }
            },
            trigger: {
                pressed: false,
                value: 0.0,
                triggerEvent() {

                    self._triggerValueButton(
                        'trigger', self._gamepad.buttons[ 1 ].value
                    );

                }
            },
            menu: {
                pressed: false,
                triggerEvent() {
                    self._triggerBoolButton(
                        'menu',
                        self._gamepad.buttons[ 3 ].pressed
                    );

                }
            }
        };

    }

    update( data ) {

        this._gamepad = this._findGamepad( this._gamepadID );
        if ( this._gamepad === undefined || this._gamepad.pose ===
            undefined ) {
            this.visible = false;
            return;
        }

        //  Position and orientation.
        let pose = this._gamepad.pose;
        if ( pose === null ) return; // No user action yet

        if ( pose.position !== null )
            this.position.fromArray( pose.position );

        if ( pose.orientation !== null )
            this.quaternion.fromArray( pose.orientation );

        this.matrix.compose( this.position, this.quaternion, this.scale );
        this.matrix.multiplyMatrices( this.standingMatrix, this.matrix );
        this.matrixWorldNeedsUpdate = true;
        this.visible = true;

        // Sends trigger / release event for every registered button.
        for ( let bID in this.buttons ) this.buttons[ bID ].triggerEvent();

        // Makes selected material glow (e.g: half of controller).
        for ( let mat of this.glow.meshes ) {
            mat.emissive.lerp(
                GLOW[ this.glow.target ], this.glow.delta / GLOW_TIME
            );
        }

        if ( this.glow.delta >= GLOW_TIME ) {
            this.glow.target = ( this.glow.target + 1 ) % 2;
            this.glow.delta = 0.0;
        }

        this.glow.delta += data.delta;

    }

    addGlow( id ) {

        let root = this.children[ 0 ];
        for ( let i = 0; i < root.children.length; ++i ) {
            let elt = root.children[ i ];
            elt.material = elt.material.clone();
            if ( elt.name === id ) this.glow.meshes.push( elt.material );
        }

    }

    eraseGlow( id ) {

        for ( let i = 0; i < this.glow.meshes.length; ++i ) {
            let elt = this.glow.meshes[ i ];
            if ( elt.name === id ) this.glow.meshes.splice( i, 1 );
        }

    }

    _findGamepad( id ) {

        // Iterate across gamepads as Vive Controllers may not be
        // in position 0 and 1.
        let gamepads = navigator.getGamepads();
        for ( let i = 0, j = 0; i < 4; i++ ) {
            let gamepad = gamepads[ i ];

            if ( gamepad && ( gamepad.id === 'OpenVR Gamepad' ||
                    gamepad.id ===
                    'Oculus Touch (Left)' || gamepad.id ===
                    'Oculus Touch (Right)' ) ) {

                if ( j === id ) return gamepad;

                j++;
            }
        }
        return undefined;

    }

    _triggerBoolButton( buttonID, newValue ) {

        let button = this.buttons[ buttonID ];
        if ( button.pressed !== newValue ) {
            this.dispatchEvent( {
                type: buttonID,
                status: newValue ? 'Down' : 'Up'
            } );
            button.pressed = newValue;
        } else if ( button.pressed ) {
            this.dispatchEvent( {
                type: buttonID
            } );
        }

    }

    _triggerValueButton( buttonID, value ) {

        let button = this.buttons[ buttonID ];
        button.value = value;

        let newPressed = value >= 0.005;
        if ( button.pressed !== newPressed ) {
            this.dispatchEvent( {
                type: buttonID,
                status: newPressed ? 'Down' : 'Up',
                pressure: button.value
            } );
            button.pressed = newPressed;
        } else if ( button.pressed ) {
            this.dispatchEvent( {
                type: buttonID,
                pressure: button.value
            } );
        }

    }

}
