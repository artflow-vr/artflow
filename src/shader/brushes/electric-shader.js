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

        'vec3 Strand(in vec2 fragCoord, in vec3 color, in float hoffset, in float hscale, in float vscale, in float timescale)',
       '{',

            'vec2 iResolution = vResolution;',
           ' float glow = 0.06 * iResolution.y;',
            'float twopi = 6.28318530718;',
            'float curve = 1.0 - abs(fragCoord.y - (sin(mod(fragCoord.x * hscale / 100.0 / iResolution.x * 1000.0 + uTime * timescale + hoffset, twopi)) * iResolution.y * 0.25 * vscale + iResolution.y / 2.0));',
            'float i = clamp(curve, 0.0, 1.0);',
            'i += clamp((glow + curve) / glow, 0.0, 1.0) * 0.4 ;',
            'return i * color;',
        '}',

        'vec3 Muzzle(in vec2 fragCoord, in float timescale)',
        '{',

            'vec2 iResolution = vResolution;',
            'float theta = atan(iResolution.y / 2.0 - fragCoord.y, iResolution.x - fragCoord.x + 0.13 * iResolution.x);',
            'float len = iResolution.y * (10.0 + sin(theta * 20.0 + float(int(uTime * 20.0)) * -35.0)) / 11.0;',
            'float d = max(-0.6, 1.0 - (sqrt(pow(abs(iResolution.x - fragCoord.x), 2.0) + pow(abs(iResolution.y / 2.0 - ((fragCoord.y - iResolution.y / 2.0) * 4.0 + iResolution.y / 2.0)), 2.0)) / len));',
            'return vec3(d * (1.0 + sin(theta * 10.0 + floor(uTime * 20.0) * 10.77) * 0.5), d * (1.0 + -cos(theta * 8.0 - floor(uTime * 20.0) * 8.77) * 0.5), d * (1.0 + -sin(theta * 6.0 - floor(uTime * 20.0) * 134.77) * 0.5));',
        '}',

        'void main()',
        '{',
            'float timescale = 4.0;',
            'vec3 c = vec3(0, 0, 0);',
            'vec2 fragCoord =  vUv.xy * vResolution.xy;',
            'c += Strand(fragCoord, vec3(1.0, 0, 0), 0.7934 + 1.0 + sin(uTime) * 30.0, 1.0, 0.16, 10.0 * timescale);',
            'c += Strand(fragCoord, vec3(0.0, 1.0, 0.0), 0.645 + 1.0 + sin(uTime) * 30.0, 1.5, 0.2, 10.3 * timescale);',
            'c += Strand(fragCoord, vec3(0.0, 0.0, 1.0), 0.735 + 1.0 + sin(uTime) * 30.0, 1.3, 0.19, 8.0 * timescale);',
            'c += Strand(fragCoord, vec3(1.0, 1.0, 0.0), 0.9245 + 1.0 + sin(uTime) * 30.0, 1.6, 0.14, 12.0 * timescale);',
            'c += Strand(fragCoord, vec3(0.0, 1.0, 1.0), 0.7234 + 1.0 + sin(uTime) * 30.0, 1.9, 0.23, 14.0 * timescale);',
            'c += Strand(fragCoord, vec3(1.0, 0.0, 1.0), 0.84525 + 1.0 + sin(uTime) * 30.0, 1.2, 0.18, 9.0 * timescale);',
            'c += clamp(Muzzle(fragCoord, timescale), 0.0, 1.0);',
            'if (c == vec3(0.0)) discard;',
            'gl_FragColor = vec4(c.r, c.g, c.b, 1.0);',
        '}'

    ].join( '\n' )

};
