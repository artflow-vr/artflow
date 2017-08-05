'use strict';

let THREE = window.THREE;

let AssetManager = require( '../utils/asset-manager' );

let ModelView = require( '../view/model-view' );

function TeleporterControl( nbPoints ) {

    if ( nbPoints === undefined || nbPoints === null ) {
        let errorMsg = 'the number of points for the spline is undefined!';
        throw Error( 'TeleporterControl: ' + errorMsg );
    }

    this._view = new ModelView( AssetManager.get( AssetManager.TELEPORTER ) );
    this._view.getObject().scale.set( 4, 4, 4 );

    this._nbPoints = nbPoints;

    let splineVertices = new Array( nbPoints );
    for ( let i = 0; i < nbPoints; ++i )
        splineVertices[ i ] = new THREE.Vector3( 0, 0, 0 );

    this._spline = new THREE.CatmullRomCurve3( splineVertices );
    this._splineGeometry = new THREE.Geometry();
    for ( let i = 0; i < this._spline.points.length * 6; i++ ) {
        this._splineGeometry.vertices[ i ] = new THREE.Vector3( 0, 0, 0 );
    }

    let material = new THREE.LineBasicMaterial( {
        color: 0xff00f0
    } );
    this._splineLine = new THREE.Line( this._splineGeometry, material );

    console.log( this._spline );

    this.velocity = 8.0;

}
module.exports = TeleporterControl;

TeleporterControl.GRAVITY_CONST = -9.81;
TeleporterControl.HALF_GRAVITY_CONST = TeleporterControl.GRAVITY_CONST / 2.0;

TeleporterControl.prototype.update = function ( direction, initPos ) {

    let dirScale = direction.clone().multiplyScalar( this.velocity );
    let hitTime = this._findIntersectionTime( dirScale.y, initPos.y );

    this._updateSpline( dirScale, initPos, hitTime );

    this._setToHitPoint( dirScale, initPos, hitTime, this._view );

};

TeleporterControl.prototype.getView = function () {

    return this._view;

};

TeleporterControl.prototype.getSplineLine = function () {

    return this._splineLine;

};

TeleporterControl.prototype._setToHitPoint = function ( v, p, time ) {

    this._view.getObject().position.x = v.x * time + p.x;
    // For now, we only support on ground teleportation, it is safe
    // to hardcore the y component.
    this._view.getObject().position.y = 0;
    this._view.getObject().position.z = v.z * time + p.z;

};

TeleporterControl.prototype._findIntersectionTime = function ( vy, py ) {

    // Using Newton's second law of motion, we have something of the form:
    // 0.5 * g * t^2 + Vy0 * t + Oy0 = 0.

    let delta = vy * vy - 4 * TeleporterControl.HALF_GRAVITY_CONST * py;
    let sqrtDelta = Math.sqrt( delta );
    return ( -vy - sqrtDelta ) / TeleporterControl.GRAVITY_CONST;
    //let t2 = ( - vy + sqrtDelta ) / TeleporterControl.GRAVITY_CONST;
    //return ( - py ) / ( vy + 0.5 * TeleporterControl.GRAVITY_CONST );

};

TeleporterControl.prototype._updateSpline = function ( v, p, time ) {

    let step = time / this._nbPoints;
    let t = 0.0;
    for ( let i = 0; i < this._nbPoints; ++i ) {
        t += step;

        this._spline.points[ i ].x = v.x * t + p.x;
        this._spline.points[ i ].y = (
            TeleporterControl.HALF_GRAVITY_CONST * t * t + v.y * t + p.y
        );
        this._spline.points[ i ].z = v.z * t + p.z;
    }

    let position = null;
    let index = null;
    for ( let i = 0; i < this._spline.points.length * 6; i++ ) {
        index = i / ( this._nbPoints * 6 );
        position = this._spline.getPoint( index );
        this._splineGeometry.vertices[ i ].x = position.x;
        this._splineGeometry.vertices[ i ].y = position.y;
        this._splineGeometry.vertices[ i ].z = position.z;
        console.log( position.x );
    }

    this._splineGeometry.verticesNeedUpdate = true;

};
