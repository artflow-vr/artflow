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

import AbstractTool from './abstract-tool';
import MainView from '../../view/main-view';
import { AssetManager } from '../../utils/asset-manager';

const GRAVITY_CONST = -9.81;
const HALF_GRAVITY_CONST = GRAVITY_CONST / 2.0;
const MATERIAL = new THREE.MeshLambertMaterial( {
    color: new THREE.Color( 0X27ae60 ),
    emissive: 0X27ae60,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.9
} );

export default class TeleporterTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.setOptionsIfUndef( {
            velocity: 8.0,
            nbPoints: 10,
            nbSub: 5
        } );

        this._mesh = AssetManager.assets.model.teleporter;
        this._mesh.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh )
                child.material = MATERIAL;

        } );

        this._direction = new THREE.Vector3( 0, 0, -1 );

        this._splineGeometry = new THREE.Geometry();
        this._splineLine = new THREE.Line(
            this._splineGeometry,
            new THREE.LineDashedMaterial( {
                color: 0X27ae60,
                dashSize: 0.2,
                gapSize: 0.4,
                linewidth: 2
            } )
        );
        this._spline = new THREE.CatmullRomCurve3( new Array( this.options.nbPoints ) );

        for ( let i = 0; i < this.options.nbPoints; ++i )
            this._spline.points[ i ] = new THREE.Vector3( 0, 0, 0 );

        for ( let i = 0; i < this._spline.points.length * this.options.nbSub; ++i )
            this._splineGeometry.vertices[ i ] = new THREE.Vector3( 0, 0, 0 );

        this.localGroup.addTHREEObject( this._mesh );
        this.localGroup.addTHREEObject( this._splineLine );

        // The code below links the teleporter method to the associated events.
        let self = this;
        this.registerEvent( 'thumbpad', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self ),
            release: self.release.bind( self )
        } );

    }

    use( data ) {

        let localPos = data.position.local;

        this._direction.x = 0;
        this._direction.y = 0;
        this._direction.z = -1;
        this._direction.applyQuaternion( data.orientation );

        this._direction.multiplyScalar( this.options.velocity );
        let hitTime = this._findIntersectionTime(
            this._direction.y, localPos.y
        );

        this._updateSpline( this._direction, localPos, hitTime );
        this._setToHitPoint( this._direction, localPos, hitTime, this._view );

    }

    trigger() {

        this.enabled = true;
        this.dynamic = true;
        this.localGroup.setVisible( true );

    }

    release() {

        let direction = new THREE.Vector3();
        let position = this.getTargetPosition();

        direction.subVectors(
            MainView.getCamera().getWorldPosition(), position
        );

        MainView.getGroup().position.x += direction.x;
        MainView.getGroup().position.z += direction.z;

        this.enabled = false;
        this.dynamic = false;
        this.localGroup.setVisible( false );

    }

    getTargetPosition() {

        return this._mesh.position;

    }

    _setToHitPoint( v, p, time ) {

        this._mesh.position.x = v.x * time + p.x;
        // For now, we only support on ground teleportation, it is safe
        // to hardcore the y component.
        this._mesh.position.y = 0;
        this._mesh.position.z = v.z * time + p.z;

    }

    _findIntersectionTime( vy, py ) {

        // Using Newton's second law of motion, we have something of the form:
        // 0.5 * g * t^2 + Vy0 * t + Oy0 = 0.
        let delta = vy * vy - 4 * HALF_GRAVITY_CONST * py;
        let sqrtDelta = Math.sqrt( delta );
        return ( -vy - sqrtDelta ) / GRAVITY_CONST;

    }

    _updateSpline( v, p, time ) {

        let step = time / this.options.nbPoints;
        let t = 0.0;

        // Updates spline raw data with Newton's second law.
        for ( let i = 0; i < this.options.nbPoints; ++i ) {
            t += step;

            this._spline.points[ i ].x = v.x * t + p.x;
            this._spline.points[ i ].y = (
                HALF_GRAVITY_CONST * t * t + v.y * t + p.y
            );
            this._spline.points[ i ].z = v.z * t + p.z;
        }

        // Updates geometry with spline vertices
        let position = null;
        let index = null;
        for ( let i = 0; i < this._spline.points.length * this.options.nbSub; ++
            i ) {
            index = i / ( this.options.nbPoints * this.options.nbSub );
            position = this._spline.getPoint( index );
            this._splineGeometry.vertices[ i ].x = position.x;
            this._splineGeometry.vertices[ i ].y = position.y;
            this._splineGeometry.vertices[ i ].z = position.z;
        }

        this._splineGeometry.verticesNeedUpdate = true;
        this._splineGeometry.computeLineDistances();
        this._splineGeometry.computeBoundingSphere();

    }

}
