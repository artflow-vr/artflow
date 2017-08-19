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
        'attribute vec4 tangent;',

        'varying vec3 vNormal;',
        'varying vec3 vTangent;',
        'varying vec3 vBinormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',

        'varying vec3 worldNormal;',
        'varying vec3 test;',

        'const vec3 down = vec3(0.0, -1.0, 0.0);',

        'void main() {',

            'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

            'vViewPosition = -mvPosition.xyz;',

            'vNormal = normalize(normalMatrix * normal );',
            '//vec3 worldNormal = normalize((modelMatrix * vec4(normal, 1.0)).xyz);',
            'vTangent = normalize(normalMatrix * tangent.xyz);',
            'vBinormal = normalize(cross(vNormal, vTangent) * tangent.w);',
            'test = normalize(normalMatrix * down);',
            'vUv = uv;',

            'gl_Position = projectionMatrix * mvPosition;',

        '}'

    ].join( '\n' ),

    fragment: [

        '#define USE_NORMALMAP',

        'varying vec3 vNormal;',
        'varying vec3 vTangent;',
        'varying vec3 vBinormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',

        'varying vec3 test;',

        'const vec3 down = vec3(0.0, -1.0, 0.0);',

        'uniform float uTime;',

        THREE.ShaderChunk.common,
        THREE.ShaderChunk.lights_pars,
        THREE.ShaderChunk.normalmap_pars_fragment,

        'void main() {',

            THREE.ShaderChunk.normal_flip,
            THREE.ShaderChunk.normal_fragment,

            'float uSlide = dot(vTangent, test);',
            'float vSlide = dot(vBinormal, test);',
            'vec2 slideUV = vUv + vec2(-uSlide, -vSlide) * uTime;',

            '//#if NUM_DIR_LIGHTS > 0',
            '//for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {',

            'gl_FragColor = vec4(texture2D( normalMap, slideUV ).xyz, 0.65);',
            '//gl_FragColor = vec4(vTangent, 1.0);',

            THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
