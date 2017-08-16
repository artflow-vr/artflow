/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 * Original file can be found at https://github.com/mrdoob/three.js/blob/dev/examples/js/vr/ViveController.js
 */

THREE.ViveController = function ( id ) {

    THREE.Object3D.call( this );

    let scope = this;
    let gamepad;

    let axes = [ 0, 0 ];
    let thumbpadIsPressed = false;
    let triggerIsPressed = false;
    let gripsArePressed = false;
    let menuIsPressed = false;

    function findGamepad( id ) {

        // Iterate across gamepads as Vive Controllers may not be
        // in position 0 and 1.

        let gamepads = navigator.getGamepads();

        for ( let i = 0, j = 0; i < 4; i++ ) {

            let gamepad = gamepads[ i ];

            if ( gamepad && ( gamepad.id === 'OpenVR Gamepad' || gamepad.id ===
                    'Oculus Touch (Left)' || gamepad.id ===
                    'Oculus Touch (Right)' ) ) {

                if ( j === id ) return gamepad;

                j++;

            }

        }

    }

    this.matrixAutoUpdate = false;
    this.standingMatrix = new THREE.Matrix4();

    this.getGamepad = function () {

        return gamepad;

    };

    this.getButtonState = function ( button ) {

        if ( button === 'thumbpad' ) return thumbpadIsPressed;
        if ( button === 'trigger' ) return triggerIsPressed;
        if ( button === 'grips' ) return gripsArePressed;
        if ( button === 'menu' ) return menuIsPressed;

    };

    this.update = function () {

        gamepad = findGamepad( id );
        if ( gamepad === undefined || gamepad.pose === undefined ) {
            scope.visible = false;
            return;
        }

        if ( gamepad.pose === null ) return; // No user action yet

        //  Position and orientation.
        let pose = gamepad.pose;

        if ( pose.position !== null )
            scope.position.fromArray( pose.position );

        if ( pose.orientation !== null )
            scope.quaternion.fromArray( pose.orientation );

        scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
        scope.matrix.multiplyMatrices( scope.standingMatrix, scope.matrix );
        scope.matrixWorldNeedsUpdate = true;
        scope.visible = true;

        // Sensitive Thumbpad
        if ( axes[ 0 ] !== gamepad.axes[ 0 ] ||
            axes[ 1 ] !== gamepad.axes[ 1 ] ) {

            axes[ 0 ] = gamepad.axes[ 0 ]; //  X axis: -1 = Left, +1 = Right.
            axes[ 1 ] = gamepad.axes[ 1 ]; //  Y axis: -1 = Bottom, +1 = Top.
            scope.dispatchEvent( {
                type: 'axischanged',
                axes: axes
            } );

        }

        // Thumpad pressed
        if ( thumbpadIsPressed !== gamepad.buttons[ 0 ].pressed ) {
            thumbpadIsPressed = gamepad.buttons[ 0 ].pressed;
            scope.dispatchEvent( {
                type: 'thumbpad',
                status: thumbpadIsPressed ? 'Down' : 'Up'
            } );
        }
        if ( gamepad.buttons[ 0 ].pressed ) {
            scope.dispatchEvent( {
                type: 'thumbpad'
            } );
        }

        if ( triggerIsPressed !== gamepad.buttons[ 1 ].pressed ) {

            triggerIsPressed = gamepad.buttons[ 1 ].pressed;
            scope.dispatchEvent( {
                type: triggerIsPressed ? 'triggerdown' : 'triggerup'
            } );

        }
        if ( gamepad.buttons[ 1 ].pressed ) {
            scope.dispatchEvent( {
                type: 'trigger'
            } );
        }

        if ( gripsArePressed !== gamepad.buttons[ 2 ].pressed ) {

            gripsArePressed = gamepad.buttons[ 2 ].pressed;
            scope.dispatchEvent( {
                type: gripsArePressed ? 'gripsdown' : 'gripsup'
            } );

        }

        if ( menuIsPressed !== gamepad.buttons[ 3 ].pressed ) {

            menuIsPressed = gamepad.buttons[ 3 ].pressed;
            scope.dispatchEvent( {
                type: menuIsPressed ? 'menudown' : 'menuup'
            } );

        }

    };

};

THREE.ViveController.prototype = Object.create( THREE.Object3D.prototype );
THREE.ViveController.prototype.constructor = THREE.ViveController;
