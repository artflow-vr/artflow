
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

        'void main(void)',
        '{	',
        '	float n = 2.5;',
        '	vec2 p = 2.2*(vUv-0.5);',
        '	p = vec2(3.0*atan(p.y,p.x),0.08+0.4*cos(5.0*length(p)));',
        '	vec2 p2 = vec2(n*cos(p.x+0.1*uTime),p.y); ',
        '	float y0 = p.y + 0.2*sin(p.x+uTime-1.0+0.5*cos(uTime));',
        '	float y1 = p.y + 0.2*cos(p.x+uTime+1.0+0.5*sin(uTime));',
        '	y0 *= y0;',
        '	y1 *= y1;',
        '	y0 = sqrt(1.0 - y0 * 100.0 * (sin(6.0*p.x+1.4*uTime) + 1.4));',
        '	y1 = sqrt(1.0 - y1 * 100.0 * (sin(6.0*p.x-1.5*uTime) + 1.5));',
        '	float y2 = cos(p.x+uTime-1.0+0.5*cos(uTime));',
        '	float y3 = -sin(p.x+uTime+1.0+0.5*sin(uTime));',
        '	float y = max(y0+y2,y1+y3);',
        '	float c = y;',
        '	vec3 color = 0.002*pow(c,10.0)+c*normalize(vec3(c,c+p2.x,-c+p2.x));',
        '   if (color == vec3(0.0))  discard;',
        '	gl_FragColor = vec4(color.yxz,1.0);',
        '}',
        ''

    ].join( '\n' )

};

