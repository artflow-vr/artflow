
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

        '#define PI 3.14159265359',
        'void main( void ) {',
        '',
        '	vec2 position = (vUv * 2.0 ) - vec2( 1.0 ); // normalise and translate to center',
        '	',
        '	',
        '	float d = distance( vec2( 0.0 ), position );',
        '	//float s = 0.15;',
        '	//d = mod( d, s );',
        '	//d = step( s * 0.5, d); // step returns 0 if second argument is less than first, 1 otherwise',
        '',
        '	',
        '	float curl = 0.1;',
        '	float m = 8.0, mm = 0.2, on = 0.5; // twiddle these',
        '	float tstep = 0.02;',
        '	float a = atan( position.y, position.x ) / PI / 2.0 + 0.5; // normalised angle',
        '	a+= d * curl /* comment line from here to go for the true whirly effect */- uTime * tstep;',
        '	float aa = step( mm * on, mod( a * m, mm ) );',
        '	aa -= mod( a * m, mm * 4.0 );',
        '	',
        '	float b = atan( position.y, position.x ) / PI / 2.0 + 0.5; // normalised angle',
        '	b-= d * curl - uTime * tstep;',
        '	float bb = step( mm * on, mod( b * m, mm ) );',
        '	bb -= mod( b * m, mm * 4.0 );',
        '	',
        '	',
        '	float c = min( aa, bb );',
        '	//c = aa;',
        '	',
        '	if ( d < 0.3 ) c = 0.0;',
        '',
        '	gl_FragColor = vec4( vec3( c * 0.2, c * 0.8, c ), 1.0 );',
        '	gl_FragColor = vec4( vec3( 0.2, 0.7, 1.0 ) * c, 1.0 );',
        '//	gl_FragColor = vec4( toCol( c, 4.0 ), 1.0 );',
        '',
        '}',
        ''

    ].join( '\n' )

};

