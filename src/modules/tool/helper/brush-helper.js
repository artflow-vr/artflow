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

import { setPropIfUndefined } from 'utils/object';

const INIT_VBO_LIMIT = 10000;
const MIN_DIST = 0.05;

const DEFAULT_OPTIONS = {
    isDynamic: true,
    maxVertices: INIT_VBO_LIMIT,
    material: null,
    computeTangents: false
};

const DEFAULT_MAT = new THREE.MeshStandardMaterial( {
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    metalness: 0.0,
    roughness: 0.85,
    color: 0x000000
} );

export default class BrushHelper {

    constructor( options, uvMode ) {

        this.options = Object.assign( {}, options );
        setPropIfUndefined( this.options, {
            brushThickness: 1.0,
            maxSpread: 1,
            color: 0x808080
        } );

        // We can choose how the UVs should be computed.
        if ( !uvMode ) {
            if ( this.options.enablePressure ) {
                this._computeUV = BrushHelper.UV_MODE.handPressure;
                this._computeThickness = this._computeThicknessWithPressure;
            } else
                this._computeUV = BrushHelper.UV_MODE.hand;
        } else
            this._computeUV = uvMode;
        this._computeUV = this._computeUV.bind( this );

        this._verticesCount = 0;
        this._normalsCount = 0;
        this._uvCount = 0;
        this._vboLimit = INIT_VBO_LIMIT;

        this._material = null;
        this._geometry = null;
        this._vertices = null;
        this._normals = null;
        this._meshes = [];
        this._uvs = null;
        this._uv = 0;
        this._axisLock = new THREE.Vector3( 0, 0, -1 );
        this._pointA = new THREE.Vector3( 0, 0, 0 );
        this._pointB = new THREE.Vector3( 0, 0, 0 );
        this._lastPoint = new THREE.Vector3( Number.NEGATIVE_INFINITY );
        this._sizePoint = null;
        this._lastSizePoint = null;
        this._lastPressure = 0.0;
        this._thickness = this.options.brushThickness / 2.0;

        this._computeThickness = () => {

            return this._thickness;

        };

        this._material = this.options.material || DEFAULT_MAT.clone();
        if ( this._material.color )
            this._material.color.setHex( this.options.color );

    }

    createMesh( options ) {

        let data = options || DEFAULT_OPTIONS;
        let dynamic = data.dynamic || true;

        this._vboLimit = data.maxVertices || INIT_VBO_LIMIT;
        this._material = data.material || this._material;

        this._geometry = new THREE.BufferGeometry();
        this._vertices = new Float32Array( this._vboLimit * 3 );
        this._normals = new Float32Array( this._vboLimit * 3 );
        this._uvs = new Float32Array( this._vboLimit * 2 );

        this._geometry.setDrawRange( 0, 0 );
        this._geometry.addAttribute(
            'position',
            new THREE.BufferAttribute( this._vertices, 3 )
        );
        this._geometry.addAttribute(
            'uv', new THREE.BufferAttribute( this._uvs, 2 )
        );
        this._geometry.addAttribute(
            'normal',
            new THREE.BufferAttribute( this._normals, 3 )
        );

        // Important step, we have to make every attributes dynamic, if we
        // are not provided a maximum
        for ( let k in this._geometry.attributes ) {
            let obj = this._geometry.attributes[ k ];
            obj.setDynamic( dynamic );
        }

        this._verticesCount = 0;
        this._normalsCount = 0;
        this._uvCount = 0;
        this._uv = 0;

        this._lastPoint.set(
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        );

        let mesh = new THREE.Mesh( this._geometry, this._material.clone() );
        mesh.drawMode = THREE.TriangleStripDrawMode;
        mesh.frustumCulled = false;

        // TODO: this is gross. It is better to keep
        // a Tree.Group and to traverse it in the tool.
        this._meshes.push( mesh );

        return mesh;

    }

    setLastSizePoint( point ) {

        this._lastSizePoint = this._sizePoint;
        this._sizePoint = new THREE.Vector2( point[ 0 ], point[ 1 ] );

    }

    setThickness( thickness ) {

        this._thickness = thickness / 2.0;

    }

    setColor( hsv ) {

        if ( this._material.color )
            this._material.color.setHSL( hsv.h, hsv.s, hsv.v );

    }

    addPoint ( pointCoords, orientation, pressureValue ) {

        if ( !this._uvs || !this._geometry || !this._vertices ) return;

        if ( this._lastPoint.distanceTo( pointCoords ) < MIN_DIST
             && this._uvs.length >= this._vboLimit )
            return;

        let max = this.options.maxSpread;
        if ( this.options.maxSpread > 0 && this._verticesCount / 6 >= this.options
            .maxSpread )
            max = this._verticesCount / 6;

        this._computeUV( max, pressureValue );

        this._processPoint( pointCoords.clone(), orientation.clone(), this._verticesCount,
            this._normalsCount, pressureValue );

        this._verticesCount += 6;
        this._uvCount += 4;

        this._geometry.attributes.normal.needsUpdate = true;
        this._geometry.attributes.position.needsUpdate = true;
        this._geometry.attributes.uv.needsUpdate = true;

        this._geometry.setDrawRange( 0, this._verticesCount / 3 );

        // TODO: Use copy instead of clone! this instanciate
        // a new point, you can just copy the data one
        // by one or call to copy()!
        this._lastPoint = pointCoords.clone();
    }

    computeTangents() {

        this._tangents = new Float32Array( this._vboLimit * 3 );
        this._tangents.userData = { count: 0 };
        this._geometry.addAttribute(
            'tangent',
            new THREE.BufferAttribute( this._tangents, 3 )
        );

        let v0 = new THREE.Vector3( 0.0 );
        let v1 = new THREE.Vector3( 0.0 );
        let normal = new THREE.Vector3( 0.0 );
        let edge = new THREE.Vector3( 0.0 );
        let tangent = new THREE.Vector3( 0.0 );

        for ( let i = 0; i < this._verticesCount - 6; i += 6 ) {

            v0.fromArray( this._vertices, i );
            v1.fromArray( this._vertices, i + 6 );
            normal.fromArray( this._normals, i );

            edge.copy( v0 );
            edge.sub( v1 );
            tangent.copy( edge );
            tangent.normalize();

            this._tangents[ this._tangents.userData.count++ ] = tangent.x;
            this._tangents[ this._tangents.userData.count++ ] = tangent.y;
            this._tangents[ this._tangents.userData.count++ ] = tangent.z;
            this._tangents[ this._tangents.userData.count++ ] = tangent.x;
            this._tangents[ this._tangents.userData.count++ ] = tangent.y;
            this._tangents[ this._tangents.userData.count++ ] = tangent.z;
        }
        this._tangents[ this._tangents.userData.count++ ] = tangent.x;
        this._tangents[ this._tangents.userData.count++ ] = tangent.y;
        this._tangents[ this._tangents.userData.count++ ] = tangent.z;
        this._tangents[ this._tangents.userData.count++ ] = tangent.x;
        this._tangents[ this._tangents.userData.count++ ] = tangent.y;
        this._tangents[ this._tangents.userData.count++ ] = tangent.z;

    }

    _processPoint( pointCoords, orientation, verticesCount_,
        normalsCount_, pressure ) {

        let verticesCount = verticesCount_;
        let normalsCount = normalsCount_;

        this._axisLock.x = -1.0;
        this._axisLock.y = 0.0;
        this._axisLock.z = 0.0;
        this._axisLock.applyQuaternion( orientation );

        let thickness = this._computeThickness( pressure );

        this._axisLock.multiplyScalar( thickness );

        this._pointA.x = pointCoords.x;
        this._pointA.y = pointCoords.y;
        this._pointA.z = pointCoords.z;
        this._pointA.sub( this._axisLock );

        this._vertices[ verticesCount++ ] = this._pointA.x;
        this._vertices[ verticesCount++ ] = this._pointA.y;
        this._vertices[ verticesCount++ ] = this._pointA.z;

        this._pointB.x = pointCoords.x;
        this._pointB.y = pointCoords.y;
        this._pointB.z = pointCoords.z;
        this._pointB.add( this._axisLock );

        this._vertices[ verticesCount++ ] = this._pointB.x;
        this._vertices[ verticesCount++ ] = this._pointB.y;
        this._vertices[ verticesCount++ ] = this._pointB.z;

        if ( this._verticesCount >= 3 * 4 ) {

            let n = new THREE.Vector3( 0 );
            for ( let i = 0; i < 3 * 3; i += 3 ) {

                let v0 = new THREE.Vector3();
                let v1 = new THREE.Vector3();
                let v2 = new THREE.Vector3();

                v0.fromArray( this._vertices, verticesCount - 9 - i );
                v1.fromArray( this._vertices, verticesCount - 6 - i );
                v2.fromArray( this._vertices, verticesCount - 3 - i );

                let v0Subv1 = v0.sub( v1 );
                let v2Subv1 = v2.sub( v1 );

                let n1 = v0Subv1.clone();
                n1.cross( v2Subv1 );

                n.add( n1 );
            }
            n.divideScalar( 3 );

            for ( let i = 0; i < 6; ++i ) {
                this._normals[ normalsCount++ ] = n.x;
                this._normals[ normalsCount++ ] = n.y;
                this._normals[ normalsCount++ ] = n.z;
            }

            this._geometry.normalizeNormals();

            this._normalsCount += 3 * 2;

        }

    }

    _computeThicknessWithPressure( pressure ) {

        let pressureValue = pressure >= 0.8 ? 0.8 : pressure;
        let test = 1.0 - Math.abs( this._lastPressure - pressureValue );
        let v = this._thickness * pressureValue * test * test;
        this._lastPressure = pressureValue;

        return v;
    }

    _computeUVWithPressure( max, pressureValue ) {

        this._uvs[ this._uv++ ] = pressureValue;
        this._uvs[ this._uv++ ] = 0;

        this._uvs[ this._uv++ ] = pressureValue;
        this._uvs[ this._uv++ ] = 1;

    }

    _computeUVWithoutPressure( max ) {

        this._uv = 0;
        for ( let i = 0; i <= max; i++ ) {
            this._uvs[ this._uv++ ] = i / max;
            this._uvs[ this._uv++ ] = 0;

            this._uvs[ this._uv++ ] = i / max;
            this._uvs[ this._uv++ ] = 1;
        }

    }

    _computeUVQuad() {

        let base = ( this._uv / 4 );

        this._uvs[ this._uv++ ] = 0.0;
        this._uvs[ this._uv++ ] = base;

        this._uvs[ this._uv++ ] = 1.0;
        this._uvs[ this._uv++ ] = base;

    }

}

BrushHelper.UV_MODE = {

    hand: BrushHelper.prototype._computeUVWithoutPressure,
    handPressure: BrushHelper.prototype._computeUVWithPressure,
    quad: BrushHelper.prototype._computeUVQuad

};
