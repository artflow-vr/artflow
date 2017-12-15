
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

        'vec2 hash( vec2 p ) ',
        '{ ',
        '	return mod(p.yx * 3., 2.)/2.;',
        '}',
        '',
        '// return distance, and cell id',
        'vec2 voronoi( in vec2 x )',
        '{',
        '    vec2 n = floor( x );',
        '    vec2 f = fract( x );',
        '',
        '	vec3 m = vec3( 8.0 );',
        '    for( int j=-2; j<=2; j++ )',
        '    for( int i=-2; i<=2; i++ )',
        '    {',
        '        vec2  g = vec2( float(i), float(j) );',
        '        vec2  o = hash( n + g );',
        '        vec2  r = g - f + (0.5+0.5*sin(uTime+6.2831*o));',
        '	float d = dot( r, r );',
        '        if( d<m.x )',
        '            m = vec3( d, o );',
        '    }',
        '',
        '    return vec2( sqrt(m.x), m.y + m.z );',
        '}',
        '',
        'void main()',
        '{',
        '    vec2 p = vUv;',
        '    ',
        '    // computer voronoi patterm',
        '    vec2 c = voronoi( 8. * p );',
        '',
        '    // colorize',
        '    vec3 col = 0.5 + 0.65* mod(c.y * 32., 25.)/25.*vec3(.72,.72,.54);',
        '	',
        '    gl_FragColor = vec4( col, 1.0 );',
        '}',
        ''

    ].join( '\n' )

};

