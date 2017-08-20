let THREE = window.THREE;

module.exports = {

    uniforms: THREE.UniformsUtils.merge(
        [
            THREE.UniformsLib.lights,
            {
                normalMap: { value: null },
                uCubemap: { value: null },
                uTime: { value: 0 },
                uSpeed: { value: 1.0 }
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
        'varying vec3 vCameraPosition;',

        'varying vec3 vDown;',

        'const vec4 DOWN = vec4(0.0, -1.0, 0.0, 1.0);',

        'void main() {',

            'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

            'vViewPosition = -mvPosition.xyz;',
            'vCameraPosition = (viewMatrix * vec4(cameraPosition, 1.0)).xyz;',

            'vNormal = normalize(normalMatrix * normal);',
            'vTangent = normalize(normalMatrix * tangent.xyz);',
            'vBinormal = normalize(cross(vNormal, vTangent) * tangent.w);',
            'vDown = normalize((viewMatrix * DOWN).xyz);',
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
        'varying vec3 vCameraPosition;',

        'varying vec3 vDown;',

        'uniform samplerCube uCubemap;',

        'uniform float uTime;',
        'uniform float uSpeed;',

        //THREE.ShaderChunk.common,
        //THREE.ShaderChunk.lights_pars,
        THREE.ShaderChunk.normalmap_pars_fragment,

        'void main() {',

            THREE.ShaderChunk.normal_flip,
            THREE.ShaderChunk.normal_fragment,

            'float uSlide = dot(vTangent, vDown);',
            'float vSlide = dot(vBinormal, vDown);',
            'uSlide = uSlide * uSlide * uSlide;',
            'vSlide = vSlide * vSlide * vSlide;',
            'vec2 slideUV = vUv + vec2(-uSlide, -vSlide) * uTime * uSpeed;',

            'vec3 cameraToVertex = normalize( - vViewPosition - vCameraPosition );',
            'vec3 reflectVec = reflect( cameraToVertex, normal );',

            '//#if NUM_DIR_LIGHTS > 0',
            '//for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {',

            'gl_FragColor = vec4(textureCube(uCubemap, reflectVec ).rgb, 1.0);',
            '//gl_FragColor = vec4(textureCube(uCubemap, reflectVec ).rgb, 1.0);',
            '//gl_FragColor = vec4(texture2D(normalMap, vUv).xyz, 1.0);',

            THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
