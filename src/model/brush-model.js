'use strict';

let THREE = window.THREE;

function BrushModel( vboLimit, texture ) {

    this.mesh = null;

    this._verticesCount = 0;
    this._normalsCount = 0;
    this._vboLimit = vboLimit;
    this._material = null;
    this._geometry = null;
    this._vertices = null;
    this._normals = null;
    this._uvs = null;
    this._brushThickness = 0.5;

    this._axisLock = new THREE.Vector3( 1, 0, 0 );
    this._controllerOrientation = new THREE.Vector3( 1, 1, 1 );

    this._helper = null;

    if ( texture ) {
        let tex = texture;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        this._material = new THREE.MeshStandardMaterial( {
            side: THREE.DoubleSide,
            map: tex,
            transparent: true,
            depthTest: false
        } );
    } else {
        this._material = new THREE.MeshStandardMaterial( {
            color: 0xff0000,
            side: THREE.DoubleSide
        } );
    }

}

BrushModel.prototype.initBrush = function () {

    this._geometry = new THREE.BufferGeometry();
    this._vertices = new Float32Array( this._vboLimit * 3 * 3 );
    this._normals = new Float32Array( this._vboLimit * 3 * 3 );
    this._uvs = new Float32Array( this._vboLimit * 2 * 2 );

    this.mesh = new THREE.Mesh( this._geometry, this._material );

    this._geometry.setDrawRange( 0, 0 );
    this._geometry.addAttribute( 'position', new THREE.BufferAttribute(
        this._vertices, 3 ).setDynamic( true ) );
    this._geometry.addAttribute( 'uv', new THREE.BufferAttribute( this._uvs,
        2 ).setDynamic( true ) );
    this._geometry.addAttribute( 'normal', new THREE.BufferAttribute( this._normals,
        3 ).setDynamic( true ) );

    this._verticesCount = 0;
    this._normalsCount = 0;

    this.mesh.drawMode = THREE.TriangleStripDrawMode;
    this.mesh.frustumCulled = false;
    this.mesh.vertices = this._vertices;
    this.mesh.uvs = this._uvs;
    this.mesh.normals = this._normals;

    this._helper = new THREE.VertexNormalsHelper( this.mesh, 1, 0xff0000, 1 );

};

BrushModel.prototype.addPoint = function ( pointCoords ) {

    let uvCount = 0;
    for ( let i = 0; i < this._verticesCount / 2; i++ ) {
        /*this._uvs[ uvCount++ ] = 0;
        this._uvs[ uvCount++ ] = 0;
        this._uvs[ uvCount++ ] = 0;
        this._uvs[ uvCount++ ] = 1;
        this._uvs[ uvCount++ ] = 1;
        this._uvs[ uvCount++ ] = 0;
        this._uvs[ uvCount++ ] = 1;
        this._uvs[ uvCount++ ] = 1;*/

        let iMod = i % this._maxSpread;

        this._uvs[ uvCount++ ] = iMod / ( this._maxSpread - 1 );
        this._uvs[ uvCount++ ] = 0;

        this._uvs[ uvCount++ ] = iMod / ( this._maxSpread - 1 );
        this._uvs[ uvCount++ ] = 1;

    }

    let dir = this._axisLock.clone();

    let mx = new THREE.Matrix4().lookAt( this._controllerOrientation, new THREE
        .Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ) );
    let qt = new THREE.Quaternion().setFromRotationMatrix( mx );

    dir.applyQuaternion( qt );

    let a = new THREE.Vector3( pointCoords.x, pointCoords.y, pointCoords.z );
    a.add( dir );
    this._vertices[ this._verticesCount++ ] = a.x;
    this._vertices[ this._verticesCount++ ] = a.y;
    this._vertices[ this._verticesCount++ ] = a.z;

    let b = new THREE.Vector3( this._brushThickness + pointCoords.x,
        pointCoords.y, pointCoords.z );
    b.add( dir );
    this._vertices[ this._verticesCount++ ] = b.x;
    this._vertices[ this._verticesCount++ ] = b.y;
    this._vertices[ this._verticesCount++ ] = b.z;

    if ( this._verticesCount >= 3 * 4 ) {
        let v0 = new THREE.Vector3( this._vertices[ this._verticesCount - 9 -
                3 ], this._vertices[ this._verticesCount - 9 - 2 ],
            this._vertices[ this._verticesCount - 9 - 1 ] );
        let v1 = new THREE.Vector3( this._vertices[ this._verticesCount - 6 -
                3 ], this._vertices[ this._verticesCount - 6 - 2 ],
            this._vertices[ this._verticesCount - 6 - 1 ] );
        let v2 = a;

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

        this._helper.update();
    }

    this._geometry.attributes.normal.needsUpdate = true;
    this._geometry.attributes.position.needsUpdate = true;
    this._geometry.attributes.uv.needsUpdate = true;

    this._geometry.setDrawRange( 0, this._verticesCount / 3 );
};

module.exports = BrushModel;
