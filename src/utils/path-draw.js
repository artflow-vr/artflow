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

const DEFAULT_QUAT = new THREE.Vector3( -1, 0, 0 );
//const DEFAULT_QUAT = new THREE.Vector3( 0, 1, 0 );

let createLockPoints = ( point, initQuat, outAxisLock, outA, outB ) => {

    outAxisLock.x = initQuat.x;
    outAxisLock.y = initQuat.y;
    outAxisLock.z = initQuat.z;

    outAxisLock.applyQuaternion( point.orientation );
    outAxisLock.multiplyScalar( 0.5 );

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

export default ( points, uvFactor, initQuaternion = DEFAULT_QUAT ) => {

        // Builds a model using the default draw mode. We will not use indices
        // for now for simplicity.

        // e.g: x --- x --- x -> 6 vertices + 6 vertices.
        let nbVertices = ( points.length - 1 ) * 6;

        let attrib = {
            vertices: new Float32Array( nbVertices * 3 ),
            normals: new Float32Array( nbVertices * 3 ),
            tangents: new Float32Array( nbVertices * 3 ),
            uv: new Float32Array( nbVertices * 2 )
        };

        let vCount = 0;
        let uvCount = 0;

        let axisLock = initQuaternion.clone();
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
                pointA, initQuaternion, axisLock, vectorA, vectorB
            );

            // We are building a quad having this layout:
            //  (0.0, 0.0) B2--B (1.0, 0.0)
            //             | / |            order: A, B, A2, A2, B, B2
            //  (0.0, 1.0) A2--A (1.0, 1.0)

            nextUv = pointA.coords.distanceTo( pointB.coords ) * uvFactor + prevUv;
            let start = vCount;
            // Push A vertex
            attrib.vertices[ vCount++ ] = vectorA.x;
            attrib.vertices[ vCount++ ] = vectorA.y;
            attrib.vertices[ vCount++ ] = vectorA.z;
            attrib.uv[ uvCount++ ] = 0.0;
            attrib.uv[ uvCount++ ] = prevUv;
            // Push B vertex
            attrib.vertices[ vCount++ ] = vectorB.x;
            attrib.vertices[ vCount++ ] = vectorB.y;
            attrib.vertices[ vCount++ ] = vectorB.z;
            attrib.uv[ uvCount++ ] = 1.0;
            attrib.uv[ uvCount++ ] = prevUv;

            createLockPoints(
                pointB, initQuaternion, axisLock, vectorA, vectorB2
            );

            // Push A2 vertex
            attrib.vertices[ vCount++ ] = vectorA.x;
            attrib.vertices[ vCount++ ] = vectorA.y;
            attrib.vertices[ vCount++ ] = vectorA.z;
            attrib.uv[ uvCount++ ] = 0.0;
            attrib.uv[ uvCount++ ] = nextUv;
            // Push A2 vertex
            attrib.vertices[ vCount++ ] = vectorA.x;
            attrib.vertices[ vCount++ ] = vectorA.y;
            attrib.vertices[ vCount++ ] = vectorA.z;
            attrib.uv[ uvCount++ ] = 0.0;
            attrib.uv[ uvCount++ ] = nextUv;
            // Push B vertex
            attrib.vertices[ vCount++ ] = vectorB.x;
            attrib.vertices[ vCount++ ] = vectorB.y;
            attrib.vertices[ vCount++ ] = vectorB.z;
            attrib.uv[ uvCount++ ] = 1.0;
            attrib.uv[ uvCount++ ] = prevUv;
            // Push B2 vertex
            attrib.vertices[ vCount++ ] = vectorB2.x;
            attrib.vertices[ vCount++ ] = vectorB2.y;
            attrib.vertices[ vCount++ ] = vectorB2.z;
            attrib.uv[ uvCount++ ] = 1.0;
            attrib.uv[ uvCount++ ] = nextUv;

            // NORMAL
            // Write the normals to the `attrib.normals' attribute.
            let normal = computeNormal( vectorA.clone(), vectorB.clone(), vectorB2 );
            vecToAttrib( normal, start, vCount, attrib.normals );
            // PRIMITIVE TANGENTS
            // Write the tangents to the `attrib.tangents' attribute.
            let tangent = new THREE.Vector3();
            tangent.copy( pointB.coords );
            tangent.sub( pointA.coords ).normalize();
            vecToAttrib( tangent, start, vCount, attrib.tangents );

            prevUv = nextUv % 1.0;

        }

        /*let tan = new THREE.Vector3( 0.0 );
        let tmp = new THREE.Vector3( 0.0 );
        for ( let i = 0; i < points.length; ++i ) {
            let mean = new THREE.Vector3( 0.0 );
            let data = [];
            for ( let j = i - 1; j >= 0; --j ) {
                if ( points[ j ].coords.y < points[ i ].coords.y ) break;
                data.push( j );
            }
            for ( let j = i + 1; j <= points.length - 1; ++j ) {
                if ( points[ j ].coords.y < points[ i ].coords.y ) break;
                data.push( j );
            }

            let start = i * 18;
            let c = 0;
            for ( let val of data ) {
                c = ( val * 18 < attrib.tangents.length ) ? val * 18 : attrib.tangents.length - 18;
                tmp.set(
                    attrib.tangents[ c ],
                    attrib.tangents[ c + 1 ],
                    attrib.tangents[ c + 2 ]
                );
                mean.add( tmp );
            }
            tan.set(
                attrib.tangents[ start ],
                attrib.tangents[ start + 1 ],
                attrib.tangents[ start + 2 ]
            );

            if ( data.length > 0 ) {
                mean.divideScalar( data.length ).normalize().multiplyScalar( 0.2 );
                tan.normalize().multiplyScalar( 0.8 );
            }
            mean.add( tan ).normalize();
            vecToAttrib( mean, start, start + 18, attrib.tangents );

            console.log( 'idx : ' + i );
            console.log( data.toString() );
        }*/

        let geometry = new THREE.BufferGeometry();

        geometry.addAttribute(
            'position',
            new THREE.BufferAttribute( attrib.vertices, 3 )
        );
        geometry.addAttribute(
            'normal',
            new THREE.BufferAttribute( attrib.normals, 3 )
        );
        geometry.addAttribute(
            'tangent',
            new THREE.BufferAttribute( attrib.tangents, 3 )
        );
        geometry.addAttribute(
            'uv',
            new THREE.BufferAttribute( attrib.uv, 2 )
        );
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;
        geometry.attributes.tangent.needsUpdate = true;
        geometry.attributes.uv.needsUpdate = true;
        geometry.setDrawRange( 0, vCount / 3 );

        console.log( attrib.vertices );

        return geometry;

};
