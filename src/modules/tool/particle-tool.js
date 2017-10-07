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
import ParticleShader from '../../shader/particle/particle-shader';
import ParticleUpdate from '../../shader/particle/position-update';
import VelocityUpdate from '../../shader/particle/velocity-update';
import MainView from '../../view/main-view';

class PrimitivesRenderer {
    constructor( options ) {
        this.options = options;

        this._renderer = MainView._renderer;

        // rendering to scene does the same as rendering to texture in Three.js
        this._inputPositionsTexture = AssetManager.assets.texture.particle_position_in;
        this._inputVelocitiesTexture = AssetManager.assets.texture.particle_velocity_in;

        this.initPositionRenderPass();
    }

    initPositionRenderPass() {
        let renderTargetParams = {
            minFilter:THREE.LinearFilter,
            stencilBuffer:false,
            depthBuffer:false
        };
        this._positionsTargetScene = new THREE.Scene();
        this._velocitiesTargetScene = new THREE.Scene();

        let imageWidth = this._inputPositionsTexture.image.width;
        let imageHeight = this._inputPositionsTexture.image.height;

        this._positionsOutputTarget = new THREE.WebGLRenderTarget( imageWidth, imageHeight, renderTargetParams );
        this._velocitiesOutputTarget = new THREE.WebGLRenderTarget( imageWidth, imageHeight, renderTargetParams );

        // custom RTT materials
        this._positionsTargetTextureMat = new THREE.ShaderMaterial( {
            uniforms: {
                tVelocitiesMap : { type: 't', value: this._inputVelocitiesTexture },
                tPositionsMap : { type: 't', value: this._inputPositionsTexture },
                dt : { type: 'f', value: 0 }
            },
            vertexShader: ParticleUpdate.vertex,
            fragmentShader: ParticleUpdate.fragment
        } );
        this._velocitiesTargetTextureMat = new THREE.ShaderMaterial( {
            uniforms: {
                tVelocitiesMap : { type: 't', value: this._inputVelocitiesTexture },
                dt : { type: 'f', value: 0 }
            },
            vertexShader: VelocityUpdate.vertex,
            fragmentShader: VelocityUpdate.fragment
        } );

        this._positionsCamera = new THREE.OrthographicCamera( imageWidth / - 2,
            imageWidth / 2,
            imageHeight / 2,
            imageHeight / - 2, -10000, 10000 );
        this._velocitiesCamera = new THREE.OrthographicCamera( imageWidth / - 2,
            imageWidth / 2,
            imageHeight / 2,
            imageHeight / - 2, -10000, 10000 );

        // Setup render-to-texture scene
        this._positionsTargetTextureGeo = new THREE.PlaneGeometry( imageWidth, imageHeight );
        this._positionsTargetTextureMesh = new THREE.Mesh( this._positionsTargetTextureGeo,
            this._positionsTargetTextureMat );
        this._positionsTargetTextureMesh.position.z = -100;
        this._positionsTargetScene.add( this._positionsTargetTextureMesh );

        this._velocitiesTargetTextureGeo = new THREE.PlaneGeometry( imageWidth, imageHeight );
        this._velocitiesTargetTextureMesh = new THREE.Mesh( this._velocitiesTargetTextureGeo,
            this._velocitiesTargetTextureMat );
        this._velocitiesTargetTextureMesh.position.z = -100;
        this._velocitiesTargetScene.add( this._velocitiesTargetTextureMesh );
    }

    update( dt ) {
        this._velocitiesTargetTextureMesh.material.uniforms.dt.value = dt;
        this._renderer.render( this._velocitiesTargetScene, this._velocitiesCamera, this._velocitiesOutputTarget, true );
        this._inputVelocitiesTexture = this._velocitiesOutputTarget.texture;

        this._positionsTargetTextureMesh.material.uniforms.dt.value = dt;
        this._renderer.render( this._positionsTargetScene, this._positionsCamera, this._positionsOutputTarget, true );
        this._inputPositionsTexture = this._positionsOutputTarget.texture;

        return this._positionsOutputTarget.texture;
    }
}

class ParticleContainer extends THREE.Object3D {
    constructor( maxParticles, particleSystem ) {
        super();

        this._particleMaxCount = maxParticles || 100000;
        this._particleCursor = 0;
        this._DPR = window.devicePixelRatio;
        this._particleSystem = particleSystem;
        this._clock = new THREE.Clock();
        this._clock.start();

        // initialize position and velocity updater
        /*
        this._primitivesRenderer = new PrimitivesRenderer();
        this._updatedPositions = this._primitivesRenderer.update();
        */

        // geometry
        this.particleShaderGeo = new THREE.BufferGeometry();

        // position
        this.particleShaderGeo.addAttribute( 'position',
            new THREE.BufferAttribute( new Float32Array( this._particleMaxCount * 3 ), 3 ).setDynamic( true ) );

        // size
        this.particleShaderGeo.addAttribute( 'size',
            new THREE.BufferAttribute( new Float32Array( this._particleMaxCount ), 1 ).setDynamic( true ) );
        this.startSize = this._DPR * 10;
        this.sizeRandomness = 10;

        // material
        this._particleTexture = AssetManager.assets.texture.particle_raw;
        this.particleShaderMat = new THREE.ShaderMaterial( {
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime: { type: 'f', value: 0.0 },
                uScale: { type: 'f', value: 1.0 },
                tSprite: { type: 't', value: this._particleTexture },
                tPositions: { type: 't', value: this._updatedPositions }
            },
            blending: THREE.AdditiveBlending,
            vertexShader: ParticleShader.vertex,
            fragmentShader: ParticleShader.fragment
        } );
        this.position.set( 0, 0, 0 );

        this.init();
    }

    spawnParticle( position ) {

        this.color = new THREE.Color();

        let positionStartAttribute = this.particleShaderGeo.getAttribute( 'position' );
        positionStartAttribute.needsUpdate = true;
        // let colorAttribute = this.particleShaderGeo.getAttribute( 'color' );

        // setup reasonable default values for all arguments
        let positionRandomness = 1;

        let i = this._particleCursor;

        // position
        positionStartAttribute.array[ i * 3 ] = position.x
            + ( this._particleSystem.getRandom() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 1 ] = position.y
            + ( this._particleSystem.getRandom() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 2 ] = position.z
            + ( this._particleSystem.getRandom() * positionRandomness );

        // size
        let sizeAttribute = this.particleShaderGeo.getAttribute( 'size' );
        sizeAttribute.needsUpdate = true;
        sizeAttribute.array[ i ] = this.startSize + this._particleSystem.getRandom() * this.sizeRandomness;

        // counter and cursor
        this._particleCursor++;

        if ( this._particleCursor >= this._particleMaxCount )
            this._particleCursor = 0;

    }

    init() {
        this.particleGeometry = new THREE.Points( this.particleShaderGeo, this.particleShaderMat );
        console.log( this.particleShaderGeo );
        this.particleGeometry.frustumCulled = false;
        super.add( this.particleGeometry );
    }

    update() {
        let elapsedTime = this._clock.getElapsedTime();
        // this._updatedPositions = this._primitivesRenderer.update( elapsedTime );
        this._clock.start();
        let sizeAttribute = this.particleShaderGeo.getAttribute( 'size' );
        sizeAttribute.needsUpdate = true;
        let i = 0;
        for ( i; i <= this._particleCursor; i++ ) {
            sizeAttribute.array[ i ] = sizeAttribute.array[ i ] - elapsedTime * 10;
            if ( sizeAttribute.array[ i ] <= 0 )
                sizeAttribute.array[ i ] = this.startSize + this._particleSystem.getRandom() * this.sizeRandomness;
        }
    }

}

export default class ParticleTool extends AbstractTool {

    constructor( options ) {
super( options );

        this.setOptionsIfUndef( {
            brushSize: 1,
            thickness: 10,
            particlesPerContainer: 100000,
            particleContainers: 1
        } );

        this._brushSize = this.options.brushSize;
        this._thickness = this.options.thickness;
        this._particleContainers = 1;
        this._particlesPerContainer = 100000;
        this._particleCursor = 0;
        this._particleMaxCount = 0;
        this.rand = [];

        // Initializing particles
        this.particleContainers = [];

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

        this.initParticleContainers();
    }

    initParticleContainers() {
        for ( let i = 0; i < this._particleContainers; i ++ ) {
            let c = new ParticleContainer( this._particlesPerContainer, this );
            this.particleContainers.push( c );
            this.worldGroup.addTHREEObject( c );
        }
    }

    getRandom() {
        if ( ++this._randomIndex >= this.rand.length )
            this._randomIndex = 1;
        return this.rand[ this._randomIndex ];
    }

    initCursorMesh() {
        this._cursorMesh = new THREE.Mesh(
            new THREE.SphereGeometry( this.options.brushSize, 16, 16, 0,
                Math.PI * 2, 0, Math.PI * 2 ),
            new THREE.MeshBasicMaterial( {
                color: 0xfff0000,
                wireframe: true
            } )
        );
        this._cursorMesh.castShadow = false;
        this._cursorMesh.receiveShadow = false;
        this.worldGroup.addTHREEObject( this._cursorMesh );
    }

    spawnParticle( position ) {
        this._particleCursor ++;
        if ( this._particleCursor >= this._particleMaxCount )
            this._particleCursor = 1;
        let currentContainer = this.particleContainers[ Math.floor( this._particleCursor / this._particlesPerContainer ) ];
        currentContainer.spawnParticle( position );
        this.worldGroup.addTHREEObject( currentContainer );
    }

    use( data ) {
        this._updateBrush( data.position.world );
        this.spawnParticle( data.position.world );
    }

    _updateBrush( pointCoords ) {
        this._cursorMesh.position.x = pointCoords.x;
        this._cursorMesh.position.y = pointCoords.y;
        this._cursorMesh.position.z = pointCoords.z;
    }

    update() {
        for ( let i = 0; i < this._particleContainers; i ++ )
            this.particleContainers[ i ].update();
    }

    // At first click
    trigger() {
    }

    release() {
    }

}
