/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * Original file can be found at https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/FirstPersonControls.js
 */

'use strict';

let THREE = require( 'three' );

function FPSControls( camera ) {

    this.object = camera;
    this.target = new THREE.Vector3( 0, 0, 0 );

    this.enabled = true;

    this.movementSpeed = 1.0;
    this.lookSpeed = 5.0;

    this.fixedHeight = null;

    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.mouseX = 0;
    this.mouseY = 0;

    this.lat = 0;
    this.lon = 0;
    this.phi = 0;
    this.theta = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.viewHalfX = window.innerWidth / 2;
    this.viewHalfY = window.innerHeight / 2;

}
module.exports = FPSControls;

FPSControls.prototype.update = function ( delta ) {

    if ( this.enabled === false ) return;

    let actualMoveSpeed = delta * this.movementSpeed;
    let actualLookSpeed = delta * this.lookSpeed;
    let verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

    this.lon += this.mouseX * actualLookSpeed;
    this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

    this.lat = Math.max( -85, Math.min( 85, this.lat ) );
    this.phi = THREE.Math.degToRad( 90 - this.lat );
    this.theta = THREE.Math.degToRad( this.lon );

    this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin,
        this.verticalMax );

    let targetPosition = this.target,
        position = this.object.position;

    if ( this.moveForward ) this.object.translateZ( -actualMoveSpeed );
    if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

    if ( this.moveLeft ) this.object.translateX( -actualMoveSpeed );
    if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
    if ( this.moveDown ) this.object.translateY( -actualMoveSpeed );

    targetPosition.x = position.x + 100 *
        Math.sin( this.phi ) *
        Math.cos( this.theta );
    targetPosition.y = position.y + 100 *
        Math.cos( this.phi );
    targetPosition.z = position.z + 100 *
        Math.sin( this.phi ) *
        Math.sin( this.theta );

    this.object.lookAt( targetPosition );

    if ( this.fixedHeight !== null ) this.object.position.y = this.fixedHeight;

    this.mouseX = 0;
    this.mouseY = 0;

};

FPSControls.prototype.resize = function ( w, h ) {

    this.viewHalfX = w / 2;
    this.viewHalfY = h / 2;

};

FPSControls.prototype.moveView = function ( event ) {

    this.mouseX = event.movementX ||
        event.mozMovementX ||
        event.webkitMovementX || 0;
    this.mouseY = event.movementY ||
        event.mozMovementY ||
        event.webkitMovementY || 0;

};

FPSControls.prototype.forward = function ( trigger ) {

    this.moveForward = trigger;

};

FPSControls.prototype.backward = function ( trigger ) {

    this.moveBackward = trigger;

};

FPSControls.prototype.left = function ( trigger ) {

    this.moveLeft = trigger;

};

FPSControls.prototype.right = function ( trigger ) {

    this.moveRight = trigger;

};

FPSControls.prototype.enable = function ( trigger ) {

    this.enabled = trigger;

};

FPSControls.prototype.setFixedHeight = function ( value ) {

    this.fixedHeight = value;

};
