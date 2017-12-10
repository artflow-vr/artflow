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


        '#define maxiter 200',
        '#define m1 1.0',
        '#define m2 0.2',
        '//#define x1 0.45',
        '//#define y1 0.4',
        '//#define x2 -0.5',
        '//#define y2 -0.25',
        '#define r1 1.0',
        '#define r2 0.5',
        '#define v1 0.5',
        '#define v2 0.9',
        
        'void main( void )',
        '{',
        ' vec2 surfacePosition = vUv.xy;',
        ' float time = uTime;',
        '    vec2 z = vec2(0., 0.0);',
        '    float p = 0.0;',
        '    float dist = 0.0;',
        '    float x1 = cos(time*v1)*r1;',
        '    float y1 = sin(time*v1)*r1;',
        '    float x2 = cos(time*v2)*r2;',
        '    float y2 = sin(time*v2)*r2;',
        '    for (int i=0; i<maxiter; ++i)',
        '    {',
        '        z *= 1.0;',
        '        z = vec2(z.x*z.x-z.y*z.y, z.x*z.y*2.0) + surfacePosition + vec2(-0.8, 0.3);',
        '        p = m1/sqrt((z.x-x1)*(z.x-x1)+(z.y-y1)*(z.y-y1))+m2/sqrt((z.x-x2)*(z.x-x2)+(z.y-y2)*(z.y-y2));',
        '        if (p > dist)',
        '        {',
        '            dist = p;',
        '        }',
        '    }',
        '    dist = dist*0.01;',
        ' vec3 color = vec3(dist/0.3, dist*dist/0.03, dist/0.1);',
        ' if (color == vec3(0.0)) discard;',
        '    gl_FragColor = vec4(color, 1.0);',
        '}',

    ].join( '\n' )

};
