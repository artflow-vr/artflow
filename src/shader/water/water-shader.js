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

module.exports = {

    uniforms: THREE.UniformsUtils.merge(
        [
            THREE.UniformsLib.lights,
            {
                normalMap: {
                    value: null
                },
                normalScale: {
                    value: new THREE.Vector2( 0.8, 0.8 )
                },
                uCubemap: {
                    value: null
                },
                uTime: {
                    value: 0
                },
                uSpeed: {
                    value: 40.0
                }
            }
        ]
    ),

    vertex: [
        'attribute vec3 tangent;',

        'varying vec3 vTangent;',
        'varying vec3 vBinormal;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',
        'varying vec3 vCameraPosition;',

        'void main() {',

        'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

        'vViewPosition = -mvPosition.xyz;',
        'vCameraPosition = (viewMatrix * vec4(cameraPosition, 1.0)).xyz;',

        'vNormal = normalize(normalMatrix * normal);',
        '//vNormal = normalize(normal);',
        'vUv = uv;',

        'vTangent = normalize(tangent);',
        'vBinormal = normalize(cross(normal, vTangent));',

        'gl_Position = projectionMatrix * mvPosition;',

        '}'

    ].join( '\n' ),

    fragment: [

        '#define USE_NORMALMAP',

        'varying vec3 vTangent;',
        'varying vec3 vBinormal;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',
        'varying vec3 vCameraPosition;',

        'uniform samplerCube uCubemap;',

        'uniform float uTime;',
        'uniform float uSpeed;',

        //THREE.ShaderChunk.common,
        //THREE.ShaderChunk.lights_pars,
        'uniform sampler2D normalMap;',

        'uniform vec2 normalScale;',

        'const vec3 DOWN = vec3(0.0, -1.0, 0.0);',

        'const float ALPHA = 0.965;',

        'vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {',
        '// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988',
        'vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );',
        'vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );',
        'vec2 st0 = dFdx( uv.st );',
        'vec2 st1 = dFdy( uv.st );',

        'vec3 S = normalize( q0 * st1.t - q1 * st0.t );',
        'vec3 T = normalize( -q0 * st1.s + q1 * st0.s );',
        'vec3 N = normalize( surf_norm );',

        'vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;',
        'mapN.xy = normalScale * mapN.xy;',
        'mat3 tsn = mat3( S, T, N );',
        'return normalize( tsn * mapN );',
        '}',

        'void main() {',

        THREE.ShaderChunk.normal_flip,

        'float uSlide = vBinormal.y * DOWN.y;',
        'float vSlide = -vTangent.y * DOWN.y;',
        'uSlide = uSlide;',
        'vSlide = vSlide * 1.2;',
        'vec2 slideUV = vUv + vec2(uSlide, vSlide) * uTime * uSpeed;',

        'vec3 normal = normalize( vNormal );',
        'normal = perturbNormal2Arb( -vViewPosition, normal, slideUV );',

        'vec3 cameraToVertex = normalize( - vViewPosition - vCameraPosition );',
        'vec3 reflectVec = reflect( cameraToVertex, normal );',
        'vec3 fetchColor = textureCube(uCubemap, reflectVec ).rgb;',

        '//#if NUM_DIR_LIGHTS > 0',
        '//for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {',

        'gl_FragColor = vec4(fetchColor + vec3(0.08, 0.08, 0.15), ALPHA);',

        //THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
