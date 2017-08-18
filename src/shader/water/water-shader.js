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

        'varying vec3 worldNormal;',

        'void main() {',

            'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

            'vViewPosition = -mvPosition.xyz;',

            'vNormal = normalize( normalMatrix * normal );',
            'worldNormal = normal;',
            'vUv = uv;',

            'gl_Position = projectionMatrix * mvPosition;',

        '}'

    ].join( '\n' ),

    fragment: [

        '#define USE_NORMALMAP',

        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',

        'varying vec3 worldNormal;',

        'const vec3 down = vec3(0.0, -1.0, 0.0);',

        'uniform float uTime;',

        THREE.ShaderChunk.common,
        THREE.ShaderChunk.lights_pars,
        THREE.ShaderChunk.normalmap_pars_fragment,

        'void main() {',

            THREE.ShaderChunk.normal_flip,
            THREE.ShaderChunk.normal_fragment,

            'float v = dot(worldNormal, down);',
            'vec2 slideUV = vUv + vec2(v) * uTime;',
            '//vec2 dir = (worldNormal + down).xz;',
            '//vec2 slideUV = vUv + dir * uTime;',

            '//#if NUM_DIR_LIGHTS > 0',
            '//for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {',

            '//gl_FragColor = vec4(worldNormal, 1.0);',
            'gl_FragColor = vec4(texture2D( normalMap, slideUV ).xyz, 0.65);',

            THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
