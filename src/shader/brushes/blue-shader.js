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

        'float sinn(float x)',
        '{',
        '    return sin(x)/2.+.5;',
        '}',

        'float CausticPatternFn(vec2 pos)',
        '{',
        '    return (sin(pos.x*40.+uTime)',
        '        +pow(sin(-pos.x*130.+uTime),1.)',
        '        +pow(sin(pos.x*30.+uTime),2.)',
        '        +pow(sin(pos.x*50.+uTime),2.)',
        '        +pow(sin(pos.x*80.+uTime),2.)',
        '        +pow(sin(pos.x*90.+uTime),2.)',
        '        +pow(sin(pos.x*12.+uTime),2.)',
        '        +pow(sin(pos.x*6.+uTime),2.)',
        '        +pow(sin(-pos.x*13.+uTime),5.))/2.;',
        '}',

        'vec2 CausticDistortDomainFn(vec2 pos)',
        '{',
        '    pos.x*=(pos.y*0.60+1.);',
        '    pos.x*=1.+sin(uTime/2.)/10.;',
        '    return pos;',
        '}',

        'void main( void ) ',
        '{',
        '    vec2 pos = vUv.yx;',
        '    pos-=.5;',
        '    vec2  CausticDistortedDomain = CausticDistortDomainFn(pos);',
        '    float CausticShape = clamp(7.-length(CausticDistortedDomain.x*20.),0.,1.);',
        '    float CausticPattern = CausticPatternFn(CausticDistortedDomain);',
        '    float CausticOnFloor = CausticPatternFn(pos)+sin(pos.y*100.)*clamp(2.-length(pos*2.),0.,1.);',
        '    float Caustic;',
        '    Caustic += CausticShape*CausticPattern;',
        '    Caustic *= (pos.y+.5)/4.;',
        '    //Caustic += CausticOnFloor;',
        '    float f = length(pos+vec2(-.5,.5))*length(pos+vec2(.5,.5))*(1.+Caustic)/1.;',
        '    ',
        '    ',
        '    gl_FragColor = vec4(.1,.5,.6,1)*(f);',

        '}'

    ].join( '\n' )

};
