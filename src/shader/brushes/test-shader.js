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

        /*'void main()	{',
        '   float x = mod(uTime + gl_FragCoord.x, 20.) < 10. ? 1. : 0.;',
        '   float y = mod(uTime + gl_FragCoord.y, 20.) < 10. ? 1. : 0.;',
        '   gl_FragColor = vec4(vec3(min(x, y)), 1.);',
        '}'*/

        /*'float colormap_red(float x) {',
        '    if (x < 0.5) {',
        '        return -6.0 * x + 67.0 / 32.0;',
        '    } else {',
        '        return 6.0 * x - 79.0 / 16.0;',
        '    }',
        '}',
        
        'float colormap_green(float x) {',
        '    if (x < 0.4) {',
        '        return 6.0 * x - 3.0 / 32.0;',
        '    } else {',
        '        return -6.0 * x + 79.0 / 16.0;',
        '    }',
        '}',
        
        'float colormap_blue(float x) {',
        '    if (x < 0.7) {',
        '       return 6.0 * x - 67.0 / 32.0;',
        '    } else {',
        '       return -6.0 * x + 195.0 / 32.0;',
        '    }',
        '}',
        
        'vec4 colormap(float x) {',
        '    float r = clamp(colormap_red(x), 0.0, 1.0);',
        '    float g = clamp(colormap_green(x), 0.0, 1.0);',
        '    float b = clamp(colormap_blue(x), 0.0, 1.0);',
        '    return vec4(r, g, b, 1.0);',
        '}',

        'vec3 hsv2rgb(vec3 c)',
        '{',
        '    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);',
        '    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);',
        '    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
        '}',

        'void main() {',
        'float level = vUv.y + uTime;',
        'gl_FragColor = vec4(hsv2rgb(vec3(level)), 1.0);',
        '}'*/


        /*'vec3 hsv2rgb(vec3 c)',
        '{',
        '    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);',
        '    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);',
        '    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
        '}',
        'vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }',
      
        'float snoise(vec2 v){',
        '    const vec4 C = vec4(0.211324865405187, 0.366025403784439,',
        '                        -0.577350269189626, 0.024390243902439);',
        '    vec2 i  = floor(v + dot(v, C.yy) );',
        '    vec2 x0 = v -   i + dot(i, C.xx);',
        '    vec2 i1;',
        '    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
        '    vec4 x12 = x0.xyxy + C.xxzz;',
        '    x12.xy -= i1;',
        '    i = mod(i, 289.0);',
        '    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))',
        '                     + i.x + vec3(0.0, i1.x, 1.0 ));',
        '    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),',
        '                            dot(x12.zw,x12.zw)), 0.0);',
        '    m = m*m ;',
        '    m = m*m ;',
        '    vec3 x = 2.0 * fract(p * C.www) - 1.0;',
        '    vec3 h = abs(x) - 0.5;',
        '    vec3 ox = floor(x + 0.5);',
        '    vec3 a0 = x - ox;',
        '    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );',
        '    vec3 g;',
        '    g.x  = a0.x  * x0.x  + h.x  * x0.y;',
        '    g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
        '    return 130.0 * dot(m, g);',
        '}',
      
        'void main()',
        '{',
        '      vec2 uv = vUv;',
        '  float xnoise = snoise(vec2(uv.x, uTime / 5.0 + 10000.0));',
        '  float ynoise = snoise(vec2(uv.y, uTime / 5.0 + 500.0));',
        '  vec2 t = vec2(xnoise, ynoise);',
        '  float s1 = snoise(uv + t / 2.0 + snoise(uv + snoise(uv + t/3.0) / 5.0));',
        '  float s2 = snoise(uv + snoise(uv + s1) / 7.0);',
        '  vec3 hsv = vec3(s1, 1.0, 1.0-s2);',
        '  vec3 rgb = hsv2rgb(hsv);',
        '      gl_FragColor = vec4(rgb, 1.0);',
        ' }',*/

        /*'void main() {',
        'float level = vUv.y + uTime;',
        'float r = float(level <= 2.0) + float(level > 4.0) * 0.5;',
        'float g = max(1.0 - abs(level - 2.0) * 0.5, 0.0);',
        'float b = (1.0 - (level - 4.0) * 0.5) * float(level >= 4.0);',
        'gl_FragColor = vec4(vec3(r, g, b * 2.0), 1.0);',
        '}'*/

        'vec3 Strand(in vec2 fragCoord, in vec3 color, in float hoffset, in float hscale, in float vscale, in float timescale)',
       '{',

            'vec2 iResolution = vec2(1250, 720);',
           ' float glow = 0.06 * iResolution.y;',
            'float twopi = 6.28318530718;',
            'float curve = 1.0 - abs(fragCoord.y - (sin(mod(fragCoord.x * hscale / 100.0 / iResolution.x * 1000.0 + uTime * timescale + hoffset, twopi)) * iResolution.y * 0.25 * vscale + iResolution.y / 2.0));',
            'float i = clamp(curve, 0.0, 1.0);',
            'i += clamp((glow + curve) / glow, 0.0, 1.0) * 0.4 ;',
            'return i * color;',
        '}',
        
        'vec3 Muzzle(in vec2 fragCoord, in float timescale)',
        '{',

            'vec2 iResolution = vec2(1250, 600);',
            'float theta = atan(iResolution.y / 2.0 - fragCoord.y, iResolution.x - fragCoord.x + 0.13 * iResolution.x);',
            'float len = iResolution.y * (10.0 + sin(theta * 20.0 + float(int(uTime * 20.0)) * -35.0)) / 11.0;',
            'float d = max(-0.6, 1.0 - (sqrt(pow(abs(iResolution.x - fragCoord.x), 2.0) + pow(abs(iResolution.y / 2.0 - ((fragCoord.y - iResolution.y / 2.0) * 4.0 + iResolution.y / 2.0)), 2.0)) / len));',
            'return vec3(d * (1.0 + sin(theta * 10.0 + floor(uTime * 20.0) * 10.77) * 0.5), d * (1.0 + -cos(theta * 8.0 - floor(uTime * 20.0) * 8.77) * 0.5), d * (1.0 + -sin(theta * 6.0 - floor(uTime * 20.0) * 134.77) * 0.5));',
        '}',
        
        'void main()',
        '{',
            'float timescale = 4.0;',
            'vec3 c = vec3(0, 0, 0);',
            'vec2 fragCoord =  vUv.xy * vec2(500, 700);',
            'c += Strand(fragCoord, vec3(1.0, 0, 0), 0.7934 + 1.0 + sin(uTime) * 30.0, 1.0, 0.16, 10.0 * timescale);',
            'c += Strand(fragCoord, vec3(0.0, 1.0, 0.0), 0.645 + 1.0 + sin(uTime) * 30.0, 1.5, 0.2, 10.3 * timescale);',
            'c += Strand(fragCoord, vec3(0.0, 0.0, 1.0), 0.735 + 1.0 + sin(uTime) * 30.0, 1.3, 0.19, 8.0 * timescale);',
            'c += Strand(fragCoord, vec3(1.0, 1.0, 0.0), 0.9245 + 1.0 + sin(uTime) * 30.0, 1.6, 0.14, 12.0 * timescale);',
            'c += Strand(fragCoord, vec3(0.0, 1.0, 1.0), 0.7234 + 1.0 + sin(uTime) * 30.0, 1.9, 0.23, 14.0 * timescale);',
            'c += Strand(fragCoord, vec3(1.0, 0.0, 1.0), 0.84525 + 1.0 + sin(uTime) * 30.0, 1.2, 0.18, 9.0 * timescale);',
            'c += clamp(Muzzle(fragCoord, timescale), 0.0, 1.0);',
            'if (c == vec3(0.0)) discard;',
            'gl_FragColor = vec4(c.r, c.g, c.b, 1.0);',
        '}'

        /*'vec3 Strand(in vec2 fragCoord, in vec3 color, in float hoffset, in float hscale, in float vscale, in float timescale)',
        '{',
            'vec2 iResolution = vResolution;',
        '    float glow = 0.01 * iResolution.x;',
        '    fragCoord.x += vscale * 100.0;',
        '    float twopi = 6.28318530718;',
        '    float curve = 1.0 - abs(fragCoord.x - (sin(mod(fragCoord.y * hscale / 100.0 / iResolution.y * 1000.0 + uTime * timescale + hoffset, twopi)) * iResolution.x * 0.25 * vscale + iResolution.x / 2.0));',
        '    float i = clamp(curve, 0.0, 1.0) * 0.3;',
        '    i += clamp((glow * 2.0 + curve) / (glow * 2.0), 0.0, 1.0) * 0.3 ;',
        '    i += clamp((glow * 8.03 + curve) / (glow * 8.03), 0.0, 1.0) * 0.25 ;',
        '    i += clamp((glow * 50.03 + curve) / (glow * 50.03), 0.0, 1.0) * 0.05 ;',
        '    ',
        '    float len = sin(hoffset * timescale * 0.01 + hscale * timescale * 0.0001) * 10.0 + sqrt(pow(fragCoord.x - iResolution.x * 0.5, 2.0) + pow(fragCoord.y * 0.5, 2.0));',
        '    float d = (len + (vscale * 3.0 - 0.5) * iResolution.y) / (0.1 * iResolution.y);',
        '    return clamp(i, 0.0, 1.0) * (3.0 - d) * color;',
        '}',
        
        'void main()',
        '{',
        '    vec2 fragCoord = gl_FragCoord.xy;',
        '    float timescale = -5.0;',
        '    vec3 c = vec3(0, 0, 0);',
        '    c += Strand(fragCoord, vec3(1.0, 0.25, 0), 0.7934 + uTime * 30.0, 1.0, 0.05, 10.0 * timescale);',
        '    c += Strand(fragCoord, vec3(0.9, 0.21, 0), 0.645 + uTime * 30.0, 1.5, 0.2, 10.3 * timescale);',
        '    c += Strand(fragCoord, vec3(0.85, 0.3, 0), 0.735 + uTime * 30.0, 1.3, 0.19, 8.0 * timescale);',
        '    c += Strand(fragCoord, vec3(0.93, 0.23, 0.0), 0.9245 + uTime * 30.0, 3.0, 0.14, 12.0 * timescale);',
        '    c += Strand(fragCoord, vec3(0.97, 0.19, 0), 0.7234 + uTime * 30.0, 1.9, 0.23, 14.0 * timescale);',
        '    c += Strand(fragCoord, vec3(0.83, 0.24, 0), 0.84525 + uTime * 30.0, 1.2, 0.29, 9.0 * timescale);',
        '    ',
        '    ',
        '    gl_FragColor = vec4(c.r, c.g, c.b, 1.0);',
        '}'*/
        

    ].join( '\n' )

};
