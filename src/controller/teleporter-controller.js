'use strict';

let THREE = window.THREE;

let AssetManager = require( '../utils/asset-manager' );

let AbstractController = require( './abstract-controller' );

/**
 * A HTCVive-like Teleporter. When visible, it creates a parabola according
 * to the initial speed and the given direction vector.
 *
 * @constructor
 *
 * @param  {number} nbPoints The number of points to add to the spline. The
 * higher the value is, the greater it will impact performance.
 */
function TeleporterControl( nbPoints, velocity ) {

    AbstractController.call( this );

    this._nbPoints = nbPoints ? nbPoints : 5;
    this._nbSub = 5;

    this._mesh = AssetManager.get( AssetManager.TELEPORTER );

    this._splineGeometry = new THREE.Geometry();
    this._splineLine = new THREE.Line(
        this._splineGeometry,
        new THREE.LineDashedMaterial( {
            color: 0X27ae60, dashSize: 0.2, gapSize: 0.4, linewidth: 2
        } )
    );
    this._spline = new THREE.CatmullRomCurve3( new Array( this._nbPoints ) );

    this.velocity = velocity ? velocity : 8.0;

    for ( let i = 0; i < this._nbPoints; ++i )
        this._spline.points[ i ] = new THREE.Vector3( 0, 0, 0 );

    for ( let i = 0; i < this._spline.points.length * this._nbSub; ++i )
        this._splineGeometry.vertices[ i ] = new THREE.Vector3( 0, 0, 0 );

    this._view.addTHREEObject( this._mesh );
    this._view.addTHREEObject( this._splineLine );

}
TeleporterControl.prototype = Object.create( AbstractController.prototype );
TeleporterControl.prototype.constructor = TeleporterControl;

TeleporterControl.GRAVITY_CONST = -9.81;
TeleporterControl.HALF_GRAVITY_CONST = TeleporterControl.GRAVITY_CONST / 2.0;

/**
 * Updates teleporter position and spline.
 *
 * @param  {THREE.Vector3} direction Direction of the velocity vector used
 * to describe the trajectory parabola.
 * @param  {THREE.Vector3} initPos Initial position of the trajectory parabola.
 */
TeleporterControl.prototype.update = function ( direction, initPos ) {

    if ( !this.enabled ) return;

    let dirScale = direction.clone().multiplyScalar( this.velocity );
    let hitTime = this._findIntersectionTime( dirScale.y, initPos.y );

    this._updateSpline( dirScale, initPos, hitTime );

    this._setToHitPoint( dirScale, initPos, hitTime, this._view );

};

/**
 * Turns the teleporter visible/invisible according to the given value.
 * If the teleporter is not visible, it will not be updated
 * for performance reasons.
 *
 * @param  {boolean} trigger True to turn visible, False otherwise.
 */
TeleporterControl.prototype.enable = function( trigger ) {

    this._view.setVisible( trigger );
    this.enabled = trigger;

};

/**
 * Returns the position at wich the target is located.
 */
TeleporterControl.prototype.getTargetPosition = function() {

    return this._mesh.position;

};

/**
 * Moves the teleporter mesh to the position retrieved by using
 * Newton's second law.
 *
 * @param  {} v Initial velocity of the parabola trajectory.
 * @param  {} p Initial position of the parabola trajectory.
 * @param  {} time Time 't' at which an object will hit the ground.
 */
TeleporterControl.prototype._setToHitPoint = function ( v, p, time ) {

    this._mesh.position.x = v.x * time + p.x;
    // For now, we only support on ground teleportation, it is safe
    // to hardcore the y component.
    this._mesh.position.y = 0;
    this._mesh.position.z = v.z * time + p.z;

};

/**
 * Finds the time 't' at which an object will hit the ground.
 * This follows the Newton's second law with only one force (gravity).
 *
 * @param  {Float} vy Initial y-velocity of the parabola trajectory.
 * @param  {Float} py Initial y-position of the parabola trajectory.
 */
TeleporterControl.prototype._findIntersectionTime = function ( vy, py ) {

    // Using Newton's second law of motion, we have something of the form:
    // 0.5 * g * t^2 + Vy0 * t + Oy0 = 0.
    let delta = vy * vy - 4 * TeleporterControl.HALF_GRAVITY_CONST * py;
    let sqrtDelta = Math.sqrt( delta );
    return ( -vy - sqrtDelta ) / TeleporterControl.GRAVITY_CONST;

};

/**
 * Updates the Teleporter spline and spline geometry,
 * by computing this._nbPoints values in the parabola equation.
 *
 * @param  {} v Initial velocity of the parabola trajectory.
 * @param  {} p Initial position of the parabola trajectory.
 * @param  {} time Time 't' at which an object will hit the ground.
 */
TeleporterControl.prototype._updateSpline = function ( v, p, time ) {

    let step = time / this._nbPoints;
    let t = 0.0;

    // Updates spline raw data with Newton's second law.
    for ( let i = 0; i < this._nbPoints; ++i ) {
        t += step;

        this._spline.points[ i ].x = v.x * t + p.x;
        this._spline.points[ i ].y = (
            TeleporterControl.HALF_GRAVITY_CONST * t * t + v.y * t + p.y
        );
        this._spline.points[ i ].z = v.z * t + p.z;
    }

    // Updates geometry with spline vertices
    let position = null;
    let index = null;
    for ( let i = 0; i < this._spline.points.length * this._nbSub; ++i ) {
        index = i / ( this._nbPoints * this._nbSub );
        position = this._spline.getPoint( index );
        this._splineGeometry.vertices[ i ].x = position.x;
        this._splineGeometry.vertices[ i ].y = position.y;
        this._splineGeometry.vertices[ i ].z = position.z;
    }

    this._splineGeometry.verticesNeedUpdate = true;
    this._splineGeometry.computeLineDistances();
    this._splineGeometry.computeBoundingSphere();

};

module.exports = TeleporterControl;
