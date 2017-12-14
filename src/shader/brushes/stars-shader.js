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

        'float nrand (vec2 co)',
        '{	',
        '    float a = fract(cos(co.x * 8.3e-3 + co.y) * 4.7e5);',
        '       float b = fract(sin(co.x * 0.3e-3 + co.y) * 1.0e5);',
        '    return a * .5 + b * .5;',
        '}',

        'float genstars (float starsize, float density, float intensity, vec2 seed)',
        '{',
        '    float rnd = nrand(floor(seed * starsize));',
        '    float stars = pow(rnd,density) * intensity;',
        '    return stars;',
        '}',
        'vec3 White = vec3(1,1,1);',
        'void main (void)',
        '{',
        '    vec2 offset = vec2(uTime * 8.25,0);',
        '    ',
        '    vec2 p = 4.0 * vUv - 1.0;',
        '    ',
        '    p *= 350.0;',
        '        ',
        '    float intensity = genstars(0.025, 16.0, 2.5, p + offset * 40.);',
        '    intensity += genstars(0.05, 16.0, 1.5, p + offset * 20.);',
        '    intensity += genstars(0.10, 16.0, 0.5, p + offset * 10.);',
        '    ',
        '    gl_FragColor = vec4(intensity * White, 1);',
        '}'

    ].join( '\n' )

};
