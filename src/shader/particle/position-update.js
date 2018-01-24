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

import BaseShader from '../../shader/particle/base-shader';

module.exports = {

    vertex: BaseShader.vertex,

    fragment: [
        'uniform sampler2D tPositionsMap;',
        'uniform sampler2D tVelocitiesMap;',
        'uniform sampler2D tInitialVelocitiesMap;',
        'uniform sampler2D tInitialPositionsMap;',
        'uniform float lifespanEntropy;',
        'uniform float normVelocity;',
        'uniform float dt;',
        'varying vec2 a_uv;',

        'void main() {',
        '   vec4 position = texture2D( tPositionsMap, a_uv );',
        '   vec4 initialPosition = texture2D( tInitialPositionsMap, a_uv );',
        '   vec4 velocity = texture2D( tVelocitiesMap, a_uv );',
        '   vec4 velocity_centered = velocity - vec4(0.5, 0.5, 0.5, 0.0);',
        '   vec4 position_updated =  vec4((position + velocity_centered * dt * normVelocity).xyz, position.a - lifespanEntropy);',
        //'   vec4 position_updated =  vec4((position + vec4(0.5, 0.0, 0.0, 0.0) * dt * normVelocity).xyz, position.a - lifespanEntropy);',
        '   if ( position_updated.w <= 0.0 )',
        '       position_updated = initialPosition;',
        '	gl_FragColor =  position_updated;',
        '}'

    ].join( '\n' )
};
