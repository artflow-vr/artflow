/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * Original file can be found at https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/FirstPersonControls.js
 */

let VERICAL_MIN = 0;
let VERICAL_MAX = Math.PI;
let UP_DIR = new THREE.Vector3( 0, 1, 0 );

const BRAKE_FACTOR = 2.5;

export default class FPSControls {

    constructor( camera, movingWorld ) {

        this.enabled = true;

        this.object = camera;

        this.forward = false;
        this.backward = false;
        this.left = false;
        this.right = false;

        this.movementSpeed = 5.0;
        this.lookSpeed = 5.0;

        this.fixedHeight = false;

        this._movingWorld = movingWorld;
        this._target = new THREE.Vector3( 0, 0, 0 );

        this._forwardDir = new THREE.Vector3( 0, 0, 0 );
        this.rightDir = new THREE.Vector3( 0, 0, 0 );

        this._mouseX = 0;
        this._mouseY = 0;

        this._lat = 0;
        this._lon = 0;
        this._phi = 0;
        this._theta = 0;

    }

    update( delta ) {

        if ( this.enabled === false ) return;

        let actualMoveSpeed = delta * this.movementSpeed;
        let actualLookSpeed = delta * this.lookSpeed;

        this._lon += this._mouseX * actualLookSpeed;
        this._lat -= this._mouseY * actualLookSpeed;

        this._lat = Math.max( -85, Math.min( 85, this._lat ) );
        this._phi = THREE.Math.degToRad( 90 - this._lat );
        this._theta = THREE.Math.degToRad( this._lon );

        this._phi = THREE.Math.mapLinear( this._phi, 0, Math.PI,
            VERICAL_MIN,
            VERICAL_MAX );

        this._target.x = 100 * Math.sin( this._phi ) * Math.cos( this._theta );
        this._target.y = 100 * Math.cos( this._phi );
        this._target.z = 100 * Math.sin( this._phi ) * Math.sin( this._theta );

        this.object.lookAt( this._target );
        this.object.getWorldDirection( this._forwardDir );

        this.rightDir.crossVectors( UP_DIR, this._forwardDir );

        if ( this.forward )
            this._movingWorld.translateOnAxis(
                this._forwardDir, - actualMoveSpeed
            );

        if ( this.backward )
            this._movingWorld.translateOnAxis(
                this._forwardDir, actualMoveSpeed
            );

        if ( this.left )
            this._movingWorld.translateOnAxis(
                this.rightDir, - actualMoveSpeed
            );
        if ( this.right )
            this._movingWorld.translateOnAxis(
                this.rightDir, actualMoveSpeed
            );

        if ( this.fixedHeight ) this._movingWorld.position.y = 0;

        let factor = delta * BRAKE_FACTOR;

        let x = Math.abs(this._mouseX);
        let y = Math.abs(this._mouseY);
        this._mouseX = x > 0.0 ? this._mouseX - (factor * this._mouseX) : 0.0;
        this._mouseY = y > 0.0 ? this._mouseY - (factor * this._mouseY) : 0.0;

    }

    moveView( event ) {

        this._mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this._mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    }

}
