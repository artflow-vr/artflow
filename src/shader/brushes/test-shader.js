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
                }
                /*vResolution: {
                    type: 'v2',
                    value: new THREE.Vector2()
                }*/
            }
        ]
    ),

    vertex: [

        'uniform float uTime;',

        'void main()	{',
        '   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
        '   gl_Position = projectionMatrix * mvPosition;',
        '}'

    ].join( '\n' ),

    fragment: [

        'uniform float uTime;',

        'void main()	{',
        '   float x = mod(uTime + gl_FragCoord.x, 20.) < 10. ? 1. : 0.;',
        '   float y = mod(uTime + gl_FragCoord.y, 20.) < 10. ? 1. : 0.;',
        '   gl_FragColor = vec4(vec3(min(x, y)), 1.);',
        '}'


        /*'void main() {',
        'float level = uTime;',
        'float r = float(level <= 2.0) + float(level > 4.0) * 0.5;',
        'float g = max(1.0 - abs(level - 2.0) * 0.5, 0.0);',
        'float b = (1.0 - (level - 4.0) * 0.5) * float(level >= 4.0);',
        'gl_FragColor = vec4(vec3(r * 2.0, g * 2.0, b * 2.0), 1.0);',
        '}'*/

    ].join( '\n' )

};
