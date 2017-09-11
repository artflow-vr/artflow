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

        'uniform float uTime;',
        'uniform float uScale;',
        'uniform sampler2D tNoise;',

        'attribute vec3 positionStart;',
        'attribute float startTime;',
        'attribute vec3 velocity;',
        'attribute float turbulence;',
        'attribute vec3 color;',
        'attribute float size;',
        'attribute float lifeTime;',

        'varying vec4 vColor;',
        'varying float lifeLeft;',

        'void main() {',

        // unpack things from our attributes'

        '	vColor = vec4( color, 1.0 );',

        // convert our velocity back into a value we can use'

        '	vec3 newPosition;',
        '	vec3 v;',

        '	float timeElapsed = uTime - startTime;',

        '	lifeLeft = 1.0 - ( timeElapsed / lifeTime );',

        '	gl_PointSize = ( uScale * size ) * lifeLeft;',

        '	v.x = ( velocity.x - 0.5 ) * 3.0;',
        '	v.y = ( velocity.y - 0.5 ) * 3.0;',
        '	v.z = ( velocity.z - 0.5 ) * 3.0;',

        '	newPosition = positionStart + ( v * 10.0 ) * timeElapsed;',

        '	vec3 noise = texture2D( tNoise, vec2( newPosition.x * 0.015 + ( uTime * 0.05 ), newPosition.y * 0.02 + ( uTime * 0.015 ) ) ).rgb;',
        '	vec3 noiseVel = ( noise.rgb - 0.5 ) * 30.0;',

        '	newPosition = mix( newPosition, newPosition + vec3( noiseVel * ( turbulence * 5.0 ) ), ( timeElapsed / lifeTime ) );',

        '	if( v.y > 0. && v.y < .05 ) {',

        '		lifeLeft = 0.0;',

        '	}',

        '	if( v.x < - 1.45 ) {',

        '		lifeLeft = 0.0;',

        '	}',

        '	if( timeElapsed > 0.0 ) {',

        '		gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );',

        '	} else {',

        '		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '		lifeLeft = 0.0;',
        '		gl_PointSize = 0.;',

        '	}',

        '}'

    ].join( '\n' ),

    fragment: [

        'float scaleLinear( float value, vec2 valueDomain ) {',

        '	return ( value - valueDomain.x ) / ( valueDomain.y - valueDomain.x );',

        '}',

        'float scaleLinear( float value, vec2 valueDomain, vec2 valueRange ) {',

        '	return mix( valueRange.x, valueRange.y, scaleLinear( value, valueDomain ) );',

        '}',

        'varying vec4 vColor;',
        'varying float lifeLeft;',

        'uniform sampler2D tSprite;',

        'void main() {',

        '	float alpha = 0.;',

        '	if( lifeLeft > 0.995 ) {',

        '		alpha = scaleLinear( lifeLeft, vec2( 1.0, 0.995 ), vec2( 0.0, 1.0 ) );',

        '	} else {',

        '		alpha = lifeLeft * 0.75;',

        '	}',

        '	vec4 tex = texture2D( tSprite, gl_PointCoord );',
        '	gl_FragColor = vec4( vColor.rgb * tex.a, alpha * tex.a );',

        '}'

    ].join( '\n' )
};
