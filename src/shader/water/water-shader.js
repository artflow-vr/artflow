let THREE = window.THREE;

module.exports = {

    uniforms: THREE.UniformsUtils.merge(
        [
            THREE.UniformsLib.lights,
            {
                normalMap: { value: null },
                normalScale: { value: new THREE.Vector2( 0.8, 0.8 ) },
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
        'uniform sampler2D normalMap;',
        'uniform vec2 normalScale;',
        'vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {',
            '// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988',
            'vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );',
            'vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );',
            'vec2 st0 = dFdx( uv.st );',
            'vec2 st1 = dFdy( uv.st );',

            'vec3 S = normalize( q0 * st1.t - q1 * st0.t );',
            'vec3 T = normalize( -q0 * st1.s + q1 * st0.s );',
            'vec3 N = normalize( surf_norm );',

            'vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;',
            'mapN.xy = normalScale * mapN.xy;',
            'mat3 tsn = mat3( S, T, N );',
            'return normalize( tsn * mapN );',
        '}',

        'void main() {',

            THREE.ShaderChunk.normal_flip,

            'float uSlide = dot(vTangent, vDown);',
            'float vSlide = dot(vBinormal, vDown);',
            'uSlide = uSlide * uSlide * uSlide;',
            'vSlide = vSlide * vSlide * vSlide;',
            'vec2 slideUV = vUv + vec2(-uSlide, -vSlide) * uTime * uSpeed;',

            'vec3 normal = normalize( vNormal );',
            'normal = perturbNormal2Arb( -vViewPosition, normal, slideUV );',

            'vec3 cameraToVertex = normalize( - vViewPosition - vCameraPosition );',
            'vec3 reflectVec = reflect( cameraToVertex, normal );',
            'vec3 fetchColor = textureCube(uCubemap, reflectVec ).rgb;',

            '//#if NUM_DIR_LIGHTS > 0',
            '//for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {',

            'gl_FragColor = vec4(fetchColor, 1.0);',
            '//gl_FragColor = vec4(normal, 1.0);',
            '//gl_FragColor = vec4(texture2D(normalMap, vUv).xyz, 1.0);',

            THREE.ShaderChunk.linear_to_gamma_fragment,

        '}'

    ].join( '\n' )

};
