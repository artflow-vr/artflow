/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 * Original file can be found at https://github.com/mrdoob/three.js/blob/dev/examples/js/vr/ViveController.js
 */

export default class ViveController extends THREE.Object3D {

    constructor( id ) {

        super();

        this._gamepadID = id;
        this._gamepad = null;

        this.standingMatrix = new THREE.Matrix4();
        this.matrixAutoUpdate = false;

        let self = this;

        this.buttons = {
            thumbpad: {
                pressed: false,
                axes: [ 0, 0 ],
                triggerEvent() {

                    let axes = self._gamepad.axes;
                    let val = self.buttons.thumbpad.axes;
                    if ( val[ 0 ] !== axes[ 0 ] || val[ 1 ] !==
                        axes[ 1 ] ) {
                        self.dispatchEvent( {
                            type: 'axisChanged',
                            axes: axes
                        } );
                        self.buttons.thumbpad.axes[ 0 ] = axes[ 0 ];
                        self.buttons.thumbpad.axes[ 1 ] = axes[ 1 ];
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

    update() {

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

        let newPressed = value >= 0.05;
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
