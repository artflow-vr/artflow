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
    vertex: [
        'attribute float size;',
        'attribute vec2 idx;',
        'varying vec2 a_idx;',
        'uniform sampler2D tPositions;',
        'uniform float pointMaxSize;',
        'uniform float brushSize;',
        'uniform float particlesTexWidth;',
        'uniform vec3 rotation;',

        'mat4 rotationMatrix(vec3 axis, float angle)',
        '{',
            'axis = normalize(axis);',
            'float s = sin(angle);',
            'float c = cos(angle);',
            'float oc = 1.0 - c;',

            'return mat4(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,  0.0,',
                'oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,  0.0,',
                'oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c, 0.0,',
                '0.0, 0.0, 0.0, 1.0);',
        '}',

        'void main() {',
        '	vec4 position_v = texture2D( tPositions, vec2(idx.x / particlesTexWidth, idx.y / particlesTexWidth));',
        '	vec3 position_offset = position_v.xyz;',
        '	gl_PointSize = position_v.a * pointMaxSize;',
        '	position_offset = (position_offset - 0.5) * brushSize;',
        '	vec3 position_full = position + position_offset;',
        '	mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), rotation.x);',
        '	mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), rotation.y);',
        '	mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), rotation.z);',
        '	vec4 position_rotated = rotZ * (rotY * (rotX * vec4(position_full, 1.0)));',
        '	gl_Position = projectionMatrix * modelViewMatrix * position_rotated;',
        '	a_idx = idx;',
        '}'

    ].join( '\n' ),

    fragment: [
        'uniform sampler2D tSprite;',
        'varying vec2 a_idx;',
        'uniform sampler2D tPositions;',

        'void main() {',
        '	vec4 tex = texture2D( tSprite, gl_PointCoord );',
        '	gl_FragColor = vec4( tex );',
        '}'

    ].join( '\n' )
};
