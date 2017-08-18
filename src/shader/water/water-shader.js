let THREE = window.THREE;

module.exports = {

    uniforms: THREE.UniformsUtils.merge(
        [
            THREE.UniformsLib.lights,
            {
                normalMap: { type: 't', value: null },
                uTime: { value: 0 }
            }
        ]
    ),

    vertex: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',

        'void main() {',

            'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

            'vViewPosition = -mvPosition.xyz;',

            'vNormal = normalize( normalMatrix * normal );',
            'vUv = uv;',

            'gl_Position = projectionMatrix * mvPosition;',

        '}'

    ].join( '\n' ),

    fragment: [

        '#define USE_NORMALMAP',

        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',

        'uniform float uTime;',

        THREE.ShaderChunk.common,
        THREE.ShaderChunk.lights_pars,
        THREE.ShaderChunk.normalmap_pars_fragment,

        'void main() {',

            THREE.ShaderChunk.normal_flip,
            THREE.ShaderChunk.normal_fragment,

            'vec2 slideUV = vec2(vUv.x, vUv.y + uTime);',

            'vec4 color = vec4(1.0 * uTime, 0.0, 0.0, 1.0);',
            '//gl_FragColor = vec4(normal, 1.0);',
            'gl_FragColor = vec4(texture2D( normalMap, slideUV ).xyz, 0.65);',

            THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
