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

const DEFAULT_OPT = {
    uvFactor: 1.0,
    tangentMean: true,
    smoothNormal: true,
    initLock: new THREE.Vector3( -1, 0, 0 )
};

let createLockPoints = ( point, initQuat, outAxisLock, outA, outB ) => {

    outAxisLock.x = initQuat.x;
    outAxisLock.y = initQuat.y;
    outAxisLock.z = initQuat.z;

    outAxisLock.applyQuaternion( point.orientation );
    outAxisLock.multiplyScalar( 0.1 );

    outA.set( point.coords.x, point.coords.y, point.coords.z );
    outB.set( point.coords.x, point.coords.y, point.coords.z );
    outA.sub( outAxisLock );
    outB.add( outAxisLock );

};

let vecToAttrib = ( vec, start, end, outAttrib ) => {

    for ( let i = start; i < end; i += 3 ) {
        outAttrib[ i ] = vec.x;
        outAttrib[ i + 1 ] = vec.y;
        outAttrib[ i + 2 ] = vec.z;
    }

};

let computeNormal = ( vecA, vecB, vecB2 ) => {

    vecB.sub( vecB2 ).normalize();
    vecA.sub( vecB2 ).normalize();
    vecA.cross( vecB ).normalize();
    return vecA;

};

let meanTangent = ( points, tangents, blendFactor = 0.4, nbNeighbors = 3 ) => {

    let tan = new THREE.Vector3( 0.0 );
    let tmp = new THREE.Vector3( 0.0 );
    let mean = new THREE.Vector3( 0.0 );
    let selected = [];

    for ( let i = 0; i < points.length; ++i ) {
        selected.length = 0;
        mean.set( 0.0, 0.0, 0.0 );

        // Selects only the point with high altitude contribution.
        for ( let j = i - 1; j >= i - nbNeighbors && j >= 0; --j ) {
            if ( points[ j ].coords.y < points[ i ].coords.y ) break;
            selected.push( j );
        }
        for ( let j = i + 1; j < i + nbNeighbors && j <= points.length - 1; ++j ) {
            if ( points[ j ].coords.y < points[ i ].coords.y ) break;
            selected.push( j );
        }

        let nbContrib = selected.length;
        let start = i * 18;
        tan.set( tangents[ start ], tangents[ start + 1 ],tangents[ start + 2 ] );

        let c = 0;
        for ( let val of selected ) {
            c = ( val * 18 < tangents.length ) ? val * 18 : tangents.length - 18;
            tmp.set( tangents[ c ], tangents[ c + 1 ], tangents[ c + 2 ] );
            mean.add( tmp );
        }

        if ( nbContrib > 0 ) {
            mean.divideScalar( nbContrib ).normalize().multiplyScalar( blendFactor );
            tan.normalize().multiplyScalar( 1.0 - blendFactor );
        }
        mean.add( tan ).normalize();
        vecToAttrib( mean, start, start + 18, tangents );
    }

};

export default ( points, options ) => {

        let opt = options || { };
        setPropIfUndefined( opt, DEFAULT_OPT );

        // Builds a model using the default draw mode. We will not use indices
        // for now for simplicity.

        // e.g: x --- x --- x -> 6 vertices + 6 vertices.
        let nbVertices = ( points.length - 1 ) * 6;

        let attrib = {
            position: new Float32Array( nbVertices * 3 ),
            normal: new Float32Array( nbVertices * 3 ),
            tangent: new Float32Array( nbVertices * 3 ),
            uv: new Float32Array( nbVertices * 2 )
        };

        let vCount = 0;
        let uvCount = 0;

        let axisLock = new THREE.Vector3( 0.0 );
        axisLock.set( opt.initLock.x, opt.initLock.y, opt.initLock.z );

        let vectorA = new THREE.Vector3( 0.0 );
        let vectorB = new THREE.Vector3( 0.0 );
        let vectorB2 = new THREE.Vector3( 0.0 );

        let nextUv = 1.0;
        let prevUv = 0.0;

        for ( let i = 0; i < points.length - 1; ++i ) {
            let pointA = points[ i ];
            let pointB = points[ i + 1 ];

            // Initializes the quaternion to the inital value.
            createLockPoints(
                pointA, opt.initLock, axisLock, vectorA, vectorB
            );

            // We are building a quad having this layout:
            //  (0.0, 0.0) B2--B (1.0, 0.0)
            //             | / |            order: A, B, A2, A2, B, B2
            //  (0.0, 1.0) A2--A (1.0, 1.0)

            nextUv = pointA.coords.distanceTo( pointB.coords ) * opt.uvFactor + prevUv;
            let start = vCount;
            // Push A vertex
            attrib.position[ vCount++ ] = vectorA.x;
            attrib.position[ vCount++ ] = vectorA.y;
            attrib.position[ vCount++ ] = vectorA.z;
            attrib.uv[ uvCount++ ] = 0.0;
            attrib.uv[ uvCount++ ] = prevUv;
            // Push B vertex
            attrib.position[ vCount++ ] = vectorB.x;
            attrib.position[ vCount++ ] = vectorB.y;
            attrib.position[ vCount++ ] = vectorB.z;
            attrib.uv[ uvCount++ ] = 1.0;
            attrib.uv[ uvCount++ ] = prevUv;

            createLockPoints(
                pointB, opt.initLock, axisLock, vectorA, vectorB2
            );

            // Push A2 vertex
            attrib.position[ vCount++ ] = vectorA.x;
            attrib.position[ vCount++ ] = vectorA.y;
            attrib.position[ vCount++ ] = vectorA.z;
            attrib.uv[ uvCount++ ] = 0.0;
            attrib.uv[ uvCount++ ] = nextUv;
            // Push A2 vertex
            attrib.position[ vCount++ ] = vectorA.x;
            attrib.position[ vCount++ ] = vectorA.y;
            attrib.position[ vCount++ ] = vectorA.z;
            attrib.uv[ uvCount++ ] = 0.0;
            attrib.uv[ uvCount++ ] = nextUv;
            // Push B vertex
            attrib.position[ vCount++ ] = vectorB.x;
            attrib.position[ vCount++ ] = vectorB.y;
            attrib.position[ vCount++ ] = vectorB.z;
            attrib.uv[ uvCount++ ] = 1.0;
            attrib.uv[ uvCount++ ] = prevUv;
            // Push B2 vertex
            attrib.position[ vCount++ ] = vectorB2.x;
            attrib.position[ vCount++ ] = vectorB2.y;
            attrib.position[ vCount++ ] = vectorB2.z;
            attrib.uv[ uvCount++ ] = 1.0;
            attrib.uv[ uvCount++ ] = nextUv;

            // NORMAL
            // Write the normals to the `attrib.normals' attribute.
            let normal = computeNormal( vectorA.clone(), vectorB.clone(), vectorB2 );
            vecToAttrib( normal, start, vCount, attrib.normal );

            // PRIMITIVE TANGENTS
            // Write the tangents to the `attrib.tangents' attribute.
            let tangent = new THREE.Vector3();
            tangent.copy( pointB.coords );
            tangent.sub( pointA.coords ).normalize();
            vecToAttrib( tangent, start, vCount, attrib.tangent );

            prevUv = nextUv % 1.0;

        }

        if ( opt.tangentMean ) meanTangent( points, attrib.tangent );

        let geometry = new THREE.BufferGeometry();
        for ( let att in attrib ) {
            let val = attrib[ att ];
            let size = att !== 'uv' ? 3 : 2;
            geometry.addAttribute( att, new THREE.BufferAttribute( val, size ) );
            geometry.attributes[ att ].needsUpdate = true;
        }
        geometry.setDrawRange( 0, vCount / 3 );

        return geometry;

};
