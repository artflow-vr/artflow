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

        'void main() {',
        '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '	gl_PointSize = size;',
        '	a_idx = idx;',
        '}'

    ].join( '\n' ),

    fragment: [
        'uniform sampler2D tSprite;',
        'varying vec2 a_idx;',
        'uniform sampler2D tPositions;',

        'void main() {',
        //'	vec4 tex = texture2D( tSprite, gl_PointCoord );',
        '	vec4 tex = texture2D( tPositions, vec2(a_idx.x / 512.0, a_idx.y / 512.0));',
        '	gl_FragColor = vec4( tex );',
        //'	gl_FragColor = vec4( a_idx.x / 512.0, a_idx.y * 100.0 / 512.0, 0.0, 1.0 );',
        '}'

    ].join( '\n' )
};
