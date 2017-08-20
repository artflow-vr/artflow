let THREE = window.THREE;

module.exports = {

    uniforms: THREE.UniformsUtils.merge(
        [
            THREE.UniformsLib.lights,
            {
                normalMap: { value: null },
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

        'varying vec3 vDown;',

        'const vec3 DOWN = vec3(0.0, -1.0, 0.0);',

        'void main() {',

            'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

            'vViewPosition = -mvPosition.xyz;',

            'vNormal = normalize(normalMatrix * normal);',
            'vTangent = normalize(normalMatrix * tangent.xyz);',
            'vBinormal = normalize(cross(vNormal, vTangent) * tangent.w);',
            'vDown = normalize(normalMatrix * DOWN);',
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
        'varying vec3 vDown;',

        'uniform float uTime;',

        //THREE.ShaderChunk.common,
        //THREE.ShaderChunk.lights_pars,
        THREE.ShaderChunk.normalmap_pars_fragment,

        'void main() {',

            //THREE.ShaderChunk.normal_flip,
            //THREE.ShaderChunk.normal_fragment,

            'float uSlide = dot(vTangent, vDown);',
            'float vSlide = dot(vBinormal, vDown);',
            'vec2 slideUV = vUv + vec2(-uSlide, -vSlide) * uTime * 10.0;',

            '//#if NUM_DIR_LIGHTS > 0',
            '//for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {',

            'gl_FragColor = vec4(texture2D( normalMap, slideUV ).xyz, 0.65);',
            '//gl_FragColor = vec4(vec3(vTangent), 1.0);',

            //THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
