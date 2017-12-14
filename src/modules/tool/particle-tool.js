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

import AbstractTool from './abstract-tool';
import { AssetManager } from '../../utils/asset-manager';
import BaseShader from '../../shader/particle/base-shader';
import MainView from '../../view/main-view';

class PrimitivesRenderer {
    constructor( options ) {
        this.options = options;
        this._bufferSide = PrimitivesRenderer._getNextPowerTwo( this.options.bufferSide );
        this._renderer = MainView._renderer;
        this._t = 0.0;

        // Set up RTTs
        this.initPositionRenderPass();

        this._indices = [];
        this.initIndicesArray();
    }

    static _getNextPowerTwo( nb ) {
        let i = 1;
        while ( i < nb )
            i *= 2;
        return i;
    }

    initIndicesArray() {
        for ( let i = this._bufferSide - 1; i >= 0; i-- )
            for ( let j = this._bufferSide - 1; j >= 0; j-- )
                this._indices.push( i * this._bufferSide + j );
    }

    getAvailableIndex() {
        let idx = this._indices.pop();
        return { x: idx % this._bufferSide, y: Math.floor( idx / this._bufferSide ) };
    }

    initPositionRenderPass() {
        // Set up cameras
        this._positionsCamera = new THREE.OrthographicCamera( this._bufferSide / - 2,
            this._bufferSide / 2,
            this._bufferSide / 2,
            this._bufferSide / - 2, -10000, 10000 );

        // Create scenes
        this._positionRTTScene = new THREE.Scene();
        this._velocityRTTScene = new THREE.Scene();

        // Create render targets
        let renderTargetParams = {
            type:THREE.FloatType,
            minFilter:THREE.LinearFilter,
            stencilBuffer:false,
            depthBuffer:false
        };
        this._positionRT1 = new THREE.WebGLRenderTarget( this._bufferSide, this._bufferSide, renderTargetParams );
        this._positionRT2 = new THREE.WebGLRenderTarget( this._bufferSide, this._bufferSide, renderTargetParams );
        this._velocityRT1 = new THREE.WebGLRenderTarget( this._bufferSide, this._bufferSide, renderTargetParams );
        this._velocityRT2 = new THREE.WebGLRenderTarget( this._bufferSide, this._bufferSide, renderTargetParams );

        this._positionBufferTex1 = this.options.positionInitialTex;
        this._positionInitialTex = THREE.ImageUtils.copyDataTexture( this._positionBufferTex1,
            this._bufferSide, this._bufferSide );
        this._positionBufferTex1.needsUpdate = true;

        this._velocityBufferTex1 = this.options.velocityInitialTex;
        this._velocityInitialTex = THREE.ImageUtils.copyDataTexture( this._velocityBufferTex1,
            this._bufferSide, this._bufferSide );
        this._velocityBufferTex1.needsUpdate = true;

        // Initialize RTT materials
        this._positionsTargetTextureMat = new THREE.ShaderMaterial( {
            uniforms: {
                tPositionsMap : { type: 't', value: this._positionBufferTex1 },
                tVelocitiesMap : { type: 't', value: this._velocityBufferTex1 },
                tInitialVelocitiesMap : { type: 't', value: this._velocityInitialTex },
                tInitialPositionsMap : { type: 't', value: this._positionInitialTex },
                dt : { type: 'f', value: 0 },
                t : { type: 'f', value: 0 }
            },
            vertexShader: this.options.positionUpdate.vertex,
            fragmentShader: this.options.positionUpdate.fragment
        } );
        for ( let elt in this.options.positionUniforms )
            this._positionsTargetTextureMat.uniforms[ elt ] = this.options.positionUniforms[ elt ];

        this._velocitiesTargetTextureMat = new THREE.ShaderMaterial( {
            uniforms: {
                tPositionsMap : { type: 't', value: this._positionBufferTex1 },
                tVelocitiesMap : { type: 't', value: this._velocityBufferTex1 },
                tInitialVelocitiesMap : { type: 't', value: this._velocityInitialTex },
                tInitialPositionsMap : { type: 't', value: this._positionInitialTex },
                dt : { type: 'f', value: 0 },
                t : { type: 'f', value: 0 }
            },
            vertexShader: this.options.velocityUpdate.vertex,
            fragmentShader: this.options.velocityUpdate.fragment
        } );
        for ( let elt in this.options.velocityUniforms )
            this._positionsTargetTextureMat.uniforms[ elt ] = this.options.velocityUniforms[ elt ];

        this._velocitiesTargetTextureMat.needsUpdate = true;

        // Setup render-to-texture scene
        this._positionsTargetTextureGeo = new THREE.PlaneGeometry( this._bufferSide, this._bufferSide );
        this._positionsTargetTextureMesh = new THREE.Mesh( this._positionsTargetTextureGeo,
            this._positionsTargetTextureMat );
        this._positionsTargetTextureMesh.position.z = 1;
        this._positionRTTScene.add( this._positionsTargetTextureMesh );

        this._velocitiesTargetTextureGeo = new THREE.PlaneGeometry( this._bufferSide, this._bufferSide );
        this._velocitiesTargetTextureMesh = new THREE.Mesh( this._velocitiesTargetTextureGeo,
            this._velocitiesTargetTextureMat );
        this._velocitiesTargetTextureMesh.position.z = 1;
        this._velocityRTTScene.add( this._velocitiesTargetTextureMesh );

        // Use to draw preview of velocity and/or position update
        this._debugPlaneMat = new THREE.ShaderMaterial( {
            uniforms: {
                tSprite : { value: this._positionRT2.texture }
            },
            vertexShader: BaseShader.vertex,
            fragmentShader: BaseShader.fragment
        } );
        this._debugPlaneGeo = new THREE.PlaneGeometry( this._bufferSide, this._bufferSide );
        this._debugPlaneMesh = new THREE.Mesh( this._debugPlaneGeo,
            this._debugPlaneMat );
    }

    update( dt ) {
        this._t += dt;
        if ( this._t < 0 ) this._t = 0;
        this._debugPlaneMat.uniforms.tSprite.value = this._positionRT2.texture;

        this._velocitiesTargetTextureMesh.material.uniforms.dt.value = dt;
        this._velocitiesTargetTextureMesh.material.uniforms.t.value = this._t;
        this._renderer.render( this._velocityRTTScene, this._positionsCamera, this._velocityRT1, true );
        let sw = this._velocityRT1;
        this._velocityRT1 = this._velocityRT2;
        this._velocityRT2 = sw;
        this._velocitiesTargetTextureMat.uniforms.tVelocitiesMap.value = this._velocityRT2.texture;

        this._positionsTargetTextureMat.uniforms.tVelocitiesMap.value = this._velocityRT2.texture;
        this._positionsTargetTextureMesh.material.uniforms.dt.value = dt;
        this._positionsTargetTextureMesh.material.uniforms.t.value = this._t;
        this._renderer.render( this._positionRTTScene, this._positionsCamera, this._positionRT1, true );
        sw = this._positionRT1;
        this._positionRT1 = this._positionRT2;
        this._positionRT2 = sw;
        this._positionsTargetTextureMat.uniforms.tPositionsMap.value = this._positionRT2.texture;

        this._velocitiesTargetTextureMat.uniforms.tPositionsMap.value = this._positionRT2.texture;

        return this._positionRT2.texture;
    }
}

class ParticleEmitter extends THREE.Object3D {
    constructor( maxParticles, particleSystem ) {
        super();

        this.options = particleSystem.options;

        this._particleMaxCount = maxParticles || 100000;
        this._particleCursor = 0;
        this._DPR = window.devicePixelRatio;
        this._particleSystem = particleSystem;

        // initialize position and velocity updater
        this._primitivesRenderer = new PrimitivesRenderer( this._particleSystem.options );

        this._primitivesRenderer._debugPlaneMesh.scale.x = 0.01;
        this._primitivesRenderer._debugPlaneMesh.scale.y = 0.01;
        this._primitivesRenderer._debugPlaneMesh.scale.z = 0.01;
        this._primitivesRenderer._debugPlaneMesh.position.x = 1;
        this._primitivesRenderer._debugPlaneMesh.position.y = 1;
        this._primitivesRenderer._debugPlaneMesh.position.z = 0;
        if ( this._particleSystem.options.debugPlane )
            MainView.addToMovingGroup( this._primitivesRenderer._debugPlaneMesh );
        this._updatedPositions = this._primitivesRenderer.update( 0 );

        // geometry
        this.particleShaderGeo = new THREE.BufferGeometry();

        // position
        this.particleShaderGeo.addAttribute( 'position',
            new THREE.BufferAttribute( new Float32Array( this._particleMaxCount * 3 ), 3 ).setDynamic( true ) );

        // index in data textures
        this.particleShaderGeo.addAttribute( 'idx',
            new THREE.BufferAttribute( new Float32Array( this._particleMaxCount * 2 ), 2 ).setDynamic( true ) );

        // index in data textures
        this.particleShaderGeo.addAttribute( 'idx',
            new THREE.BufferAttribute( new Float32Array( this._particleMaxCount * 2 ), 2 ).setDynamic( true ) );

        // material
        this._particleTexture = AssetManager.assets.texture.particle_raw;
        this.particleShaderMat = new THREE.ShaderMaterial( {
            transparent: true,
            depthWrite: false,
            uniforms: {
                tSprite: { type: 't', value: this._particleTexture },
                tPositions: { type: 't', value: this._updatedPositions },
                pointMaxSize: { type: 'f', value: this.options.pointMaxSize },
                particlesTexWidth: { type: 'f', value: PrimitivesRenderer._getNextPowerTwo(
                    this.options.bufferSide ) }
            },
            blending: THREE.AdditiveBlending,
            vertexShader: this.options.renderingShader.vertex,
            fragmentShader: this.options.renderingShader.fragment
        } );
        for ( let elt in this.options.renderingUniforms )
            this.particleShaderMat.uniforms[ elt ] = this.options.renderingUniforms[ elt ];
        this.position.set( 0, 0, 0 );

        this.init();
    }

    spawnParticle( position ) {

        this.color = new THREE.Color();

        let i = this._particleCursor;

        let idx = this._primitivesRenderer.getAvailableIndex();
        let idxAttribute = this.particleShaderGeo.getAttribute( 'idx' );
        idxAttribute.needsUpdate = true;
        idxAttribute.array[ i * 2 ] = idx.x;
        idxAttribute.array[ i * 2 + 1 ] = idx.y;

        // position
        let positionStartAttribute = this.particleShaderGeo.getAttribute( 'position' );
        positionStartAttribute.needsUpdate = true;
        positionStartAttribute.array[ i * 3 ] = position.x;
        positionStartAttribute.array[ i * 3 + 1 ] = position.y;
        positionStartAttribute.array[ i * 3 + 2 ] = position.z;

        // counter and cursor
        this._particleCursor++;

        if ( this._particleCursor >= this._particleMaxCount )
            this._particleCursor = 0;

    }

    init() {
        this.particleGeometry = new THREE.Points( this.particleShaderGeo, this.particleShaderMat );
        this.particleGeometry.frustumCulled = false;
        super.add( this.particleGeometry );
    }

    update( delta ) {
        this._updatedPositions = this._primitivesRenderer.update( delta );
        this.particleShaderMat.uniforms.tPositionsMap = this._updatedPositions;
    }

}

export default class ParticleTool extends AbstractTool {

    constructor() {
        super();

        this.dynamic = true;

        this.options = ParticleTool.items.snow.data;

        this._thickness = this.options.thickness;
        this._maxEmitters = this.options.maxEmitters;
        this._particlesPerEmitter = this.options.initialParticlesPerEmitter;
        this._particleCursor = 0;
        this.rand = [];

        // Initializing particles
        this._particleEmitters = [];
        this.initCursorMesh();

        // preload a million random numbers
        this._randomIndex = 0;
        for ( this._randomIndex = 1e5; this._randomIndex > 0; this._randomIndex-- ) {
            this.rand.push( Math.random() - 0.5 );
        }

        // Bind functions to events
        this.registerEvent( 'interact', {
            use: this.use.bind( this ),
            trigger: this.trigger.bind( this ),
            release: this.release.bind( this )
        } );
    }

    _spawnParticleEmitter() {
        if ( this._particleEmitters.length < this._maxEmitters ) {
            let c = new ParticleEmitter( this._particlesPerEmitter, this );
            this._particleEmitters.push( c );
            this.worldGroup.addTHREEObject( c );
            for ( let i = 0; i < this._particlesPerEmitter; i++ )
                c.spawnParticle( this._cursorMesh.position );
        }
    }

    getRandom() {
        if ( ++this._randomIndex >= this.rand.length )
            this._randomIndex = 1;
        return this.rand[ this._randomIndex ];
    }

    initCursorMesh() {
        this._cursorMesh = new THREE.Mesh(
            new THREE.SphereGeometry( this.options.brushSize / 2, 16, 16, 0,
                Math.PI * 2, 0, Math.PI * 2 ),
            new THREE.MeshBasicMaterial( {
                color: 0xfff0000,
                wireframe: true
            } )
        );
        this._cursorMesh.castShadow = false;
        this._cursorMesh.receiveShadow = false;
        // this.worldGroup.addTHREEObject( this._cursorMesh );
    }

    use( data ) {
        this._updateBrush( data.position.world );
    }

    _updateBrush( pointCoords ) {
        this._cursorMesh.position.x = pointCoords.x;
        this._cursorMesh.position.y = pointCoords.y;
        this._cursorMesh.position.z = pointCoords.z;
    }

    update( delta ) {
        for ( let i = 0; i < this._particleEmitters.length; i ++ )
            this._particleEmitters[ i ].update( delta.delta );
    }

    trigger() {
    }

    release() {
        console.log( this.options );
        this._spawnParticleEmitter();
    }

    onItemChanged( id ) {
        console.log( 'Changing system to ', id, typeof id );
        this.options = ParticleTool.items[ id.slice( 0 ) ].data;
        console.log( 'currStroke after change', id.slice ( 0 ) );
    }

}

