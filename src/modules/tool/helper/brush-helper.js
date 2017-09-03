'use strict';

let THREE = window.THREE;

import AbstractTool from '../abstract-tool';
import ToolModule from '../../tool-module';

function BrushHelper( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        maxSpread: 20,
        brushThickness: 0.75,
        enablePressure: false,
        color: 0x808080,
        materialId: 'material_with_tex'
    } );

    this.registeredBrushes = null;

    this._verticesCount = 0;
    this._normalsCount = 0;
    this._uvCount = 0;
    this._vboLimit = 10000;
    this._material = null;
    this._geometry = null;
    this._vertices = null;
    this._normals = null;
    this._uvs = null;
    this._uv = 0;
    this._delta = 0.05;
    this._axisLock = new THREE.Vector3( 0, 0, -1 );
    this._pointA = new THREE.Vector3( 0, 0, 0 );
    this._pointB = new THREE.Vector3( 0, 0, 0 );
    this._lastPoint = new THREE.Vector3( Number.NEGATIVE_INFINITY );
    this._lastPressure = 0.0;
    this._thickness = this.options.brushThickness / 2.0;

    this._computeUV = null;
    this._computeThickness = function () {

        return this._thickness;
    };

    if ( this.options.enablePressure ) {
        this._computeUV = this._computeUVWithPressure;
        this._computeThickness = this._computeThicknessWithPressure;
    } else
        this._computeUV = this._computeUVWithoutPressure;

    // TOOD: Helper shound not access the object pool directly like this.
    this._material = ToolModule.objectPool.getObject( this.options.materialId );
    this._material.color.setHex( this.options.color );

}
BrushHelper.prototype = Object.create( AbstractTool.prototype );
BrushHelper.prototype.constructor = BrushHelper;

BrushHelper.prototype.createMesh = function () {

    this._geometry = new THREE.BufferGeometry();
    this._vertices = new Float32Array( this._vboLimit * 3 * 3 );
    this._normals = new Float32Array( this._vboLimit * 3 * 3 );
    this._uvs = new Float32Array( this._vboLimit * 2 * 2 );

    this._geometry.setDrawRange( 0, 0 );
    this._geometry.addAttribute( 'position', new THREE.BufferAttribute(
        this._vertices, 3 ).setDynamic( true ) );
    this._geometry.addAttribute( 'uv', new THREE.BufferAttribute( this._uvs,
        2 ).setDynamic( true ) );
    this._geometry.addAttribute( 'normal', new THREE.BufferAttribute( this._normals,
        3 ).setDynamic( true ) );

    this._verticesCount = 0;
    this._normalsCount = 0;
    this._uvCount = 0;
    this._uv = 0;

    this._lastPoint = new THREE.Vector3( Number.NEGATIVE_INFINITY );

    let mesh = new THREE.Mesh( this._geometry, this._material );
    mesh.drawMode = THREE.TriangleStripDrawMode;
    mesh.frustumCulled = false;
    mesh.vertices = this._vertices;
    mesh.uvs = this._uvs;
    mesh.normals = this._normals;

    return mesh;

};

BrushHelper.prototype._processPoint = function ( pointCoords, orientation,
    verticesCount_, normalsCount_, pressure ) {

    let verticesCount = verticesCount_;
    let normalsCount = normalsCount_;

    this._axisLock.x = 1.0;
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

        let it = 3;
        if ( verticesCount - 3 * 3 === 0 )
            it = 1;
        else if ( verticesCount - 4 * 3 === 3 )
            it = 2;

        let n = new THREE.Vector3( 0 );
        for ( let i = 0; i < it * 3; i += 3 ) {

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

        n.divideScalar( it );

        this._normals[ normalsCount++ ] = n.x;
        this._normals[ normalsCount++ ] = n.y;
        this._normals[ normalsCount++ ] = n.z;

        this._normals[ normalsCount++ ] = n.x;
        this._normals[ normalsCount++ ] = n.y;
        this._normals[ normalsCount++ ] = n.z;

        this._normals[ normalsCount++ ] = n.x;
        this._normals[ normalsCount++ ] = n.y;
        this._normals[ normalsCount++ ] = n.z;

        this._normals[ normalsCount++ ] = n.x;
        this._normals[ normalsCount++ ] = n.y;
        this._normals[ normalsCount++ ] = n.z;

        this._normals[ normalsCount++ ] = n.x;
        this._normals[ normalsCount++ ] = n.y;
        this._normals[ normalsCount++ ] = n.z;

        this._normals[ normalsCount++ ] = n.x;
        this._normals[ normalsCount++ ] = n.y;
        this._normals[ normalsCount++ ] = n.z;

        this._geometry.normalizeNormals();

        this._normalsCount += 3 * 2;

    }

};

BrushHelper.prototype._computeThicknessWithPressure = function ( pressure ) {

    let pressureValue = pressure >= 0.8 ? 0.8 : pressure;
    let test = 1.0 - Math.abs( this._lastPressure - pressureValue );
    let v = this._thickness * pressureValue * test * test;
    this._lastPressure = pressureValue;

    return v;
};

BrushHelper.prototype._computeUVWithPressure = function ( max, pressureValue ) {

    this._uvs[ this._uv++ ] = pressureValue;
    this._uvs[ this._uv++ ] = 0;

    this._uvs[ this._uv++ ] = pressureValue;
    this._uvs[ this._uv++ ] = 1;

};

BrushHelper.prototype._computeUVWithoutPressure = function ( max ) {

    this._uv = 0;
    for ( let i = 0; i <= max; i++ ) {
        this._uvs[ this._uv++ ] = i / max;
        this._uvs[ this._uv++ ] = 0;

        this._uvs[ this._uv++ ] = i / max;
        this._uvs[ this._uv++ ] = 1;
    }

};

BrushHelper.prototype.addPoint = function ( pointCoords, orientation,
    pressureValue ) {

    if ( this._lastPoint.distanceTo( pointCoords ) < this._delta )
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

    this._lastPoint = pointCoords.clone();
};

module.exports = BrushHelper;
