'use strict';

let THREE = window.THREE;

let AbstractTool = require( './abstract-tool' );

let AddCommand = require( './command/add-command' );

function BrushTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        maxSpread: 50,
        brushThickness: 0.1
    } );

    this._verticesCount = 0;
    this._normalsCount = 0;
    this._vboLimit = 10000;
    this._material = null;
    this._geometry = null;
    this._vertices = null;
    this._normals = null;
    this._uvs = null;
    this._axisLock = new THREE.Vector3( 0, 0, -1 );
    this._pointA = new THREE.Vector3( 0, 0, 0 );
    this._pointB = new THREE.Vector3( 0, 0, 0 );

    if ( this.options.texture ) {
        let tex = options.texture;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        this._material = new THREE.MeshStandardMaterial( {
            side: THREE.DoubleSide,
            map: tex,
            transparent: true,
            depthTest: false,
            metalness: 0.0,
            roughness: 1.0
        } );
    } else {
        this._material = new THREE.MeshStandardMaterial( {
            color: 0xff0000,
            side: THREE.DoubleSide,
            metalness: 0.0,
            roughness: 0.9
        } );
    }

}
BrushTool.prototype = Object.create( AbstractTool.prototype );
BrushTool.prototype.constructor = BrushTool;

BrushTool.prototype.update = function () {
    // TODO: Fills with dynamic brushes
};

BrushTool.prototype.use = function ( data ) {

    this._addPoint( data.position.world, data.orientation );

};

BrushTool.prototype.trigger = function () {

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

    let mesh = new THREE.Mesh( this._geometry, this._material );
    mesh.drawMode = THREE.TriangleStripDrawMode;
    mesh.frustumCulled = false;
    mesh.vertices = this._vertices;
    mesh.uvs = this._uvs;
    mesh.normals = this._normals;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.view.addTHREEObject( mesh );

    return new AddCommand( this.view, mesh );

};

BrushTool.prototype._addPoint = function ( pointCoords, orientation ) {

    let uvCount = 0;
    for ( let i = 0; i < this._verticesCount / 2; i++ ) {
        let iMod = i % this._maxSpread;

        this._uvs[ uvCount++ ] = iMod / ( this._maxSpread - 1 );
        this._uvs[ uvCount++ ] = 0;

        this._uvs[ uvCount++ ] = iMod / ( this._maxSpread - 1 );
        this._uvs[ uvCount++ ] = 1;
    }

    this._axisLock.x = 1.0;
    this._axisLock.y = 0.0;
    this._axisLock.z = 0.0;
    this._axisLock.applyQuaternion( orientation );
    this._axisLock.multiplyScalar( this.options.brushThickness / 2.0 );

    this._pointA.x = pointCoords.x;
    this._pointA.y = pointCoords.y;
    this._pointA.z = pointCoords.z;
    this._pointA.sub( this._axisLock );

    this._vertices[ this._verticesCount++ ] = this._pointA.x;
    this._vertices[ this._verticesCount++ ] = this._pointA.y;
    this._vertices[ this._verticesCount++ ] = this._pointA.z;

    this._pointB.x = pointCoords.x;
    this._pointB.y = pointCoords.y;
    this._pointB.z = pointCoords.z;
    this._pointB.add( this._axisLock );
    this._vertices[ this._verticesCount++ ] = this._pointB.x;
    this._vertices[ this._verticesCount++ ] = this._pointB.y;
    this._vertices[ this._verticesCount++ ] = this._pointB.z;

    if ( this._verticesCount >= 3 * 4 ) {
        let v0 = new THREE.Vector3( this._vertices[ this._verticesCount - 9 -
                3 ], this._vertices[ this._verticesCount - 9 - 2 ],
            this._vertices[ this._verticesCount - 9 - 1 ] );
        let v1 = new THREE.Vector3( this._vertices[ this._verticesCount - 6 -
                3 ], this._vertices[ this._verticesCount - 6 - 2 ],
            this._vertices[ this._verticesCount - 6 - 1 ] );
        let v2 = this._pointA;

        let v0Subv1 = v0.sub( v1 );
        let v2Subv1 = v2.sub( v1 );

        let n1 = v0Subv1;
        n1.cross( v2Subv1 );

        this._normals[ this._normalsCount++ ] = n1.x;
        this._normals[ this._normalsCount++ ] = n1.y;
        this._normals[ this._normalsCount++ ] = n1.z;

        this._normals[ this._normalsCount++ ] = n1.x;
        this._normals[ this._normalsCount++ ] = n1.y;
        this._normals[ this._normalsCount++ ] = n1.z;

        this._geometry.normalizeNormals();
    }

    this._geometry.attributes.normal.needsUpdate = true;
    this._geometry.attributes.position.needsUpdate = true;
    this._geometry.attributes.uv.needsUpdate = true;

    this._geometry.setDrawRange( 0, this._verticesCount / 3 );
};

module.exports = BrushTool;
