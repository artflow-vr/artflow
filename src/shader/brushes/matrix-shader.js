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
                uTime: {
                    value: 0.0
                },
                vResolution: {
                    type: 'v2',
                    value: new THREE.Vector2()
                }
            }
        ]
    ),

    vertex: [

        'uniform float uTime;',
        'varying vec2 vUv;',

        'void main()	{',
        '   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
        '   gl_Position = projectionMatrix * mvPosition;',
        '   vUv = uv;',
        '}'

    ].join( '\n' ),

    fragment: [

        'uniform float uTime;',
        'uniform vec2 vResolution;',
        'varying vec2 vUv;',

        'void main( void )',
        '{',
        '    vec2 uv = ( gl_FragCoord.xy / vResolution.xy ) * 20.0-1.0;',
        '    uv.x *= vResolution.x/vResolution.y;',
        '    ',
        '    vec3 finalColor = vec3( 0.0, 0.0, 0.0 );',
        '    ',
        '    float g = -mod( gl_FragCoord.y + uTime, cos( gl_FragCoord.x ) + 0.004 );',
        '    g = g + clamp(uv.y, -1.0, 0.0);	',
        '    ',
        '    finalColor = vec3( 0.0, g, 0.0 );',
        '    ',
        '    gl_FragColor = vec4( finalColor, 1.0 );',
        '}',

    ].join( '\n' )

};
