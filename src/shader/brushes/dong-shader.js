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

        'vec3 getDick(vec2 position){',
        '    ',


        ' vec2 mouse = vec2(0.0);',
        '    vec3 dick = vec3(0.0);',
        '    ',
        '    float dong = 1.0 - abs(position.x * 2.0 - 1.0);',
        '          dong = pow(dong + 0.1, 2.0);',
        '          dong = smoothstep(0.99, 1.0, dong);',
        '    ',
        '    float toCenter = (1.0 - abs(position.x * 2.0 - 1.0));',
        '          toCenter = pow(toCenter*toCenter*(3.0-2.0*toCenter), 15.0);',
        '    ',
        '    float dongMask = abs(position.y * 2.0 - toCenter);',
        '          dongMask = pow(dongMask + 0.1, 10.0);',
        '          dongMask = smoothstep(0.99, 1.0, dongMask);',
        '          dongMask *= pow(position.y * 5.0, 3.0);',
        '    ',
        '          dong = mix(dong, 0.0, dongMask);',
        '    ',
        '    float topMask = pow(clamp(position.y * 1.35 + sin(cos(position.x*100.+(uTime*10.))*0.01*mouse.x), 0.0, 1.0), 90.0);',
        '    ',
        '    vec3 dickColor = vec3(1.0, 0.7, 0.6);',
        '         dickColor = mix(dickColor, vec3(1.0, 0.4, 0.5), topMask);',
        '         dickColor = mix(dickColor, vec3(1.0, 0.2, 0.2), clamp(pow(1.0 - abs(position.x * 2.0 - 1.0), 100.0), 0.0, 1.0) * pow(clamp(position.y * 1.15, 0.0, 1.0), 90.0));',
        '         ',
        '    float ballLeft = 1.0 - distance(position, vec2(0.4, 0.05));',
        '    float ballRight = 1.0 - distance(position, vec2(0.6, 0.05));',
        '    ',
        '    ballLeft = smoothstep(0.9, 0.901, ballLeft);',
        '    ballRight = smoothstep(0.9, 0.901, ballRight);',
        '    ',
        '    dick = dickColor * (dong + (ballRight + ballLeft) * (1.0 - dong));',
        '    ',
        '    return dick;	',
        '}',
        
        'void main() {',
        '',

        ' vec2 mouse = vec2(0.0);',
        '    vec2 position = vUv.yx;',
        '    position.x += cos((position.y*.1)+(uTime*10.))*5.*mouse.x;',
        '    position.x += sin((position.y*.01)+(uTime*10.))*20.*mouse.y;',
        '    ',
        '    vec3 color = vec3(0.0);',
        '    ',
        '    color = getDick(position);',
        ' if (color == vec3(0.0)) discard;',
        '    gl_FragColor = vec4(color, 1.0 );',
        
        '}',

    ].join( '\n' )

};
