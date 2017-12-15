
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

        'const float PI = 3.1415926535;',
        '',
        '',
        'void main(void)',
        '{',
        '    vec2 coord = gl_FragCoord.xy - vResolution * 0.5;',
        '	coord *= 3.0;',
        '',
        '    float phi = atan(coord.y, coord.x + 1e-6);',
        '    phi = phi / PI * 0.5 + 0.5;',
        '    float seg = floor(phi * 6.0);',
        '',
        '    float theta = (seg + 0.5) / 6.0 * PI * 2.0;',
        '    vec2 dir1 = vec2(cos(theta), sin(theta));',
        '    vec2 dir2 = vec2(-dir1.y, dir1.x);',
        '',
        '    float l = dot(dir1, coord);',
        '    float w = sin(seg * 31.415926535) * 18.0 + 20.0;',
        '    float prog = l / w + uTime * 2.0;',
        '    float idx = floor(prog);',
        '',
        '    float phase = uTime * 0.8;',
        '    float th1 = fract(273.84937 * sin(idx * 54.67458 + floor(phase    )));',
        '    float th2 = fract(273.84937 * sin(idx * 54.67458 + floor(phase + 1.0)));',
        '    float thresh = mix(th1, th2, smoothstep(0.75, 1.0, fract(phase)));',
        '',
        '    float l2 = dot(dir2, coord);',
        '    float slide = fract(idx * 32.74853) * 200.0 * uTime;',
        '    float w2 = fract(idx * 39.721784) * 500.0;',
        '    float prog2 = (l2 + slide) / w2;',
        '',
        '    float c = clamp((fract(prog) - thresh) * w * 0.3, 0.0, 1.0);',
        '    c *= clamp((fract(prog2) - 1.0 + thresh) * w2 * 0.3, 0.0, 1.0);',
        '',
        '    gl_FragColor = vec4(c, c, c, 1);',
        '}',
        ''

    ].join( '\n' )

};

