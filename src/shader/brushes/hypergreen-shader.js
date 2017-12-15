
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

        '',
        '#define PI 3.14159265359',
        '//#define uTime',
        '',
        'float random(float n) {',
        '	return fract(abs(sin(n * 55.753) * 367.34));',
        '}',
        '',
        'mat2 rotate2d(float angle){',
        '	return mat2(cos(angle), -sin(angle),  sin(angle), cos(angle));',
        '}',
        '',
        'void main( void ) {',
        '	vec2 uv = (vUv * 2.0 - 0.5);',
        '',
        '	uv *= rotate2d(uTime * 0.2); //uTime * 0.2',
        '',
        '	float direction = 1.0;',
        '	float speed = uTime * direction * 1.6;',
        '	float distanceFromCenter = length(uv);',
        '',
        '	float meteorAngle = atan(uv.y, uv.x) * (180.0 / PI);',
        '',
        '	float flooredAngle = floor(meteorAngle);',
        '	float randomAngle = pow(random(flooredAngle), 0.5);',
        '	float t = speed + randomAngle;',
        '',
        '	float lightsCountOffset = 0.4;',
        '	float adist = randomAngle / distanceFromCenter * lightsCountOffset;',
        '	float dist = t + adist;',
        '	float meteorDirection = (direction < 0.0) ? -1.0 : 0.0;',
        '	dist = abs(fract(dist) + meteorDirection);',
        '',
        '	float lightLength = 100.0;',
        '	float meteor = (5.0 / dist) * cos(sin(speed)) / lightLength;',
        '	meteor *= distanceFromCenter * 2.0;',
        '',
        '	vec3 color = vec3(0.);',
        '	color.gb += meteor;',
        '',
        '	gl_FragColor = vec4(color, 1.0);',
        '}',
        ''

    ].join( '\n' )

};

