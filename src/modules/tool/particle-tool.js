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

export default class ParticleTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.setOptionsIfUndef( {
            brushSize: 1,
            thickness: 10
        } );
        this._brushSize = this.options.brushSize;
        this._thickness = this.options.thickness;

        this._position = new THREE.Vector3( 0, 0, 0 );

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

        // Initializing particles
        this._particleTexture = AssetManager.assets.texture.particle_raw;
        this._particleNoise = AssetManager.assets.texture.particle_noise;

        this._particleCount = this.options.brushSize * this.options.thickness;
        this._pMaterial = new THREE.PointsMaterial( {
            color: 0xFFFFFF,
            size: 0.1,
            map: this._particleTexture,
            blending: THREE.AdditiveBlending,
            transparent: true
        } );

        let self = this;
        this.registerEvent( 'interact', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self ),
            release: self.release.bind( self )
        } );

        this.worldGroup.addTHREEObject( this._cursorMesh );

        this._PARTICLE_COUNT = this.options.maxParticles || 1000000;
        this._PARTICLE_CONTAINERS = this.options.containerCount || 1;

        this._PARTICLE_NOISE_TEXTURE = this.options.particleNoiseTex || null;
        this._PARTICLE_SPRITE_TEXTURE = this.options.particleSpriteTex || null;

        this._PARTICLES_PER_CONTAINER = Math.ceil( this._PARTICLE_COUNT / this._PARTICLE_CONTAINERS );
        this._PARTICLE_CURSOR = 0;
        this.time = 0;
        this.particleContainers = [];
        this.rand = [];

        // custom vertex and fragment shader
        let GPUParticleShader = {
            vertexShader: ParticleShader.vertex,
            fragmentShader: ParticleShader.fragment
        };

        // preload a million random numbers
        let i;
        for ( i = 1e5; i > 0; i-- ) {
            this.rand.push( Math.random() - 0.5 );
        }

        this.random = function() {
            if ( ++i >= this.rand.length )
                i = 1;
            return this.rand[ i ];
        };

        this.particleShaderMat = new THREE.ShaderMaterial( {
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime: {
                    value: 0.0
                },
                uScale: {
                    value: 1.0
                },
                tNoise: {
                    value: this.particleNoiseTex
                },
                tSprite: {
                    value: this.particleSpriteTex
                }
            },
            blending: THREE.AdditiveBlending,
            vertexShader: GPUParticleShader.vertexShader,
            fragmentShader: GPUParticleShader.fragmentShader
        } );

        this.particleShaderMat.defaultAttributeValues.particlePositionsStartTime = [ 0, 0, 0, 0 ];
        this.particleShaderMat.defaultAttributeValues.particleVelColSizeLife = [ 0, 0, 0, 0 ];
        this.init();
    }

    init() {
        for ( let i = 0; i < this.PARTICLE_CONTAINERS; i ++ ) {
            let c = new THREE.GPUParticleContainer( this.PARTICLES_PER_CONTAINER, this );
            this.particleContainers.push( c );
            this.add( c );
        }
    }

    spawnParticle() {
        this.PARTICLE_CURSOR ++;
        /*
        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT )
            this.PARTICLE_CURSOR = 1;
        let currentContainer = this.particleContainers[ Math.floor( this.PARTICLE_CURSOR / this.PARTICLES_PER_CONTAINER ) ];
        currentContainer.spawnParticle( options );
        */
    }

    use( data ) {
        this._updateBrush( data.position.world );

        // Create the particles
        // TODO: This loop is really bad for performance reasons.
        // it is only a POC. We should not allocate new geometry in ArtFlow.
        // We should only create meshes, and reuse geometries.
        let particles = new THREE.Geometry();
        for ( let p = 0; p < this._particleCount; p++ ) {

            // create a particle with random
            // position values, -250 -> 250
            let offsetX = Math.random() * this._brushSize - this._brushSize / 2,
                offsetY = Math.random() * this._brushSize - this._brushSize / 2,
                offsetZ = Math.random() * this._brushSize - this._brushSize / 2,
                particle =
                new THREE.Vector3(
                    this._cursorMesh.position.x + offsetX,
                    this._cursorMesh.position.y + offsetY,
                    this._cursorMesh.position.z + offsetZ
                );

            // add it to the geometry
            particles.vertices.push( particle );
        }

        // create the particle system
        let particleSystem = new THREE.Points(
            particles,
            this._pMaterial );

        // add it to the scene
        this.worldGroup.addTHREEObject( particleSystem );
    }

    _updateBrush( pointCoords ) {
        this._cursorMesh.position.x = pointCoords.x;
        this._cursorMesh.position.y = pointCoords.y;
        this._cursorMesh.position.z = pointCoords.z;
    }

    update() {
        for ( let i = 0; i < this.PARTICLE_CONTAINERS; i ++ )
            this.particleContainers[ i ].update( this.time );
    }

    dispose() {
        this.particleShaderMat.dispose();
        this.particleNoiseTex.dispose();
        this.particleSpriteTex.dispose();
        for ( let i = 0; i < this.PARTICLE_CONTAINERS; i ++ )
            this.particleContainers[ i ].dispose();
    }

    trigger() {
        this.worldGroup.addTHREEObject( this._cursorMesh );
    }

    release() {}

}

// Subclass for particle containers, allows for very large arrays to be spread out

THREE.GPUParticleContainer = function( maxParticles, particleSystem ) {

    THREE.Object3D.apply( this, arguments );

    this.PARTICLE_COUNT = maxParticles || 100000;
    this.PARTICLE_CURSOR = 0;
    this.time = 0;
    this.offset = 0;
    this.count = 0;
    this.DPR = window.devicePixelRatio;
    this.GPUParticleSystem = particleSystem;
    this.particleUpdate = false;

    // geometry

    this.particleShaderGeo = new THREE.BufferGeometry();

    this.particleShaderGeo.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'positionStart', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'startTime', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'velocity', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'turbulence', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'size', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'lifeTime', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );

    // material

    this.particleShaderMat = this.GPUParticleSystem.particleShaderMat;

    let position = new THREE.Vector3();
    let velocity = new THREE.Vector3();
    let color = new THREE.Color();

    this.spawnParticle = function( options = {} ) {

        let positionStartAttribute = this.particleShaderGeo.getAttribute( 'positionStart' );
        let startTimeAttribute = this.particleShaderGeo.getAttribute( 'startTime' );
        let velocityAttribute = this.particleShaderGeo.getAttribute( 'velocity' );
        let turbulenceAttribute = this.particleShaderGeo.getAttribute( 'turbulence' );
        let colorAttribute = this.particleShaderGeo.getAttribute( 'color' );
        let sizeAttribute = this.particleShaderGeo.getAttribute( 'size' );
        let lifeTimeAttribute = this.particleShaderGeo.getAttribute( 'lifeTime' );

        // setup reasonable default values for all arguments

        position = options.position !== undefined ? position.copy( options.position ) : position.set( 0, 0, 0 );
        velocity = options.velocity !== undefined ? velocity.copy( options.velocity ) : velocity.set( 0, 0, 0 );
        color = options.color !== undefined ? color.set( options.color ) : color.set( 0xffffff );

        let positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0;
        let velocityRandomness = options.velocityRandomness !== undefined ? options.velocityRandomness : 0;
        let colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1;
        let turbulence = options.turbulence !== undefined ? options.turbulence : 1;
        let lifetime = options.lifetime !== undefined ? options.lifetime : 5;
        let size = options.size !== undefined ? options.size : 10;
        let sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0;
        let smoothPosition = options.smoothPosition !== undefined ? options.smoothPosition : false;

        if ( this.DPR !== undefined ) size *= this.DPR;

        let i = this.PARTICLE_CURSOR;

        // position

        positionStartAttribute.array[ i * 3 ] = position.x + ( particleSystem.random() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 1 ] = position.y + ( particleSystem.random() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 2 ] = position.z + ( particleSystem.random() * positionRandomness );

        if ( smoothPosition === true ) {

            positionStartAttribute.array[ i * 3 ] += - ( velocity.x * particleSystem.random() );
            positionStartAttribute.array[ i * 3 + 1 ] += - ( velocity.y * particleSystem.random() );
            positionStartAttribute.array[ i * 3 + 2 ] += - ( velocity.z * particleSystem.random() );

        }

        // velocity

        let maxVel = 2;

        let velX = velocity.x + particleSystem.random() * velocityRandomness;
        let velY = velocity.y + particleSystem.random() * velocityRandomness;
        let velZ = velocity.z + particleSystem.random() * velocityRandomness;

        velX = THREE.Math.clamp( ( velX - ( - maxVel ) ) / ( maxVel - ( - maxVel ) ), 0, 1 );
        velY = THREE.Math.clamp( ( velY - ( - maxVel ) ) / ( maxVel - ( - maxVel ) ), 0, 1 );
        velZ = THREE.Math.clamp( ( velZ - ( - maxVel ) ) / ( maxVel - ( - maxVel ) ), 0, 1 );

        velocityAttribute.array[ i * 3 ] = velX;
        velocityAttribute.array[ i * 3 + 1 ] = velY;
        velocityAttribute.array[ i * 3 + 2 ] = velZ;

        // color

        color.r = THREE.Math.clamp( color.r + particleSystem.random() * colorRandomness, 0, 1 );
        color.g = THREE.Math.clamp( color.g + particleSystem.random() * colorRandomness, 0, 1 );
        color.b = THREE.Math.clamp( color.b + particleSystem.random() * colorRandomness, 0, 1 );

        colorAttribute.array[ i * 3 ] = color.r;
        colorAttribute.array[ i * 3 + 1 ] = color.g;
        colorAttribute.array[ i * 3 + 2 ] = color.b;

        // turbulence, size, lifetime and starttime

        turbulenceAttribute.array[ i ] = turbulence;
        sizeAttribute.array[ i ] = size + particleSystem.random() * sizeRandomness;
        lifeTimeAttribute.array[ i ] = lifetime;
        startTimeAttribute.array[ i ] = this.time + particleSystem.random() * 2e-2;

        // offset

        if ( this.offset === 0 ) {

            this.offset = this.PARTICLE_CURSOR;

        }

        // counter and cursor

        this.count ++;
        this.PARTICLE_CURSOR ++;

        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT ) {

            this.PARTICLE_CURSOR = 0;

        }

        this.particleUpdate = true;

    };

    this.init = function() {

        this.particleSystem = new THREE.Points( this.particleShaderGeo, this.particleShaderMat );
        this.particleSystem.frustumCulled = false;
        this.add( this.particleSystem );

    };

    this.update = function( time ) {

        this.time = time;
        this.particleShaderMat.uniforms.uTime.value = time;

        this.geometryUpdate();

    };

    this.geometryUpdate = function() {

        if ( this.particleUpdate === true ) {

            this.particleUpdate = false;

            let positionStartAttribute = this.particleShaderGeo.getAttribute( 'positionStart' );
            let startTimeAttribute = this.particleShaderGeo.getAttribute( 'startTime' );
            let velocityAttribute = this.particleShaderGeo.getAttribute( 'velocity' );
            let turbulenceAttribute = this.particleShaderGeo.getAttribute( 'turbulence' );
            let colorAttribute = this.particleShaderGeo.getAttribute( 'color' );
            let sizeAttribute = this.particleShaderGeo.getAttribute( 'size' );
            let lifeTimeAttribute = this.particleShaderGeo.getAttribute( 'lifeTime' );

            if ( this.offset + this.count < this.PARTICLE_COUNT ) {

                positionStartAttribute.updateRange.offset = this.offset * positionStartAttribute.itemSize;
                startTimeAttribute.updateRange.offset = this.offset * startTimeAttribute.itemSize;
                velocityAttribute.updateRange.offset = this.offset * velocityAttribute.itemSize;
                turbulenceAttribute.updateRange.offset = this.offset * turbulenceAttribute.itemSize;
                colorAttribute.updateRange.offset = this.offset * colorAttribute.itemSize;
                sizeAttribute.updateRange.offset = this.offset * sizeAttribute.itemSize;
                lifeTimeAttribute.updateRange.offset = this.offset * lifeTimeAttribute.itemSize;

                positionStartAttribute.updateRange.count = this.count * positionStartAttribute.itemSize;
                startTimeAttribute.updateRange.count = this.count * startTimeAttribute.itemSize;
                velocityAttribute.updateRange.count = this.count * velocityAttribute.itemSize;
                turbulenceAttribute.updateRange.count = this.count * turbulenceAttribute.itemSize;
                colorAttribute.updateRange.count = this.count * colorAttribute.itemSize;
                sizeAttribute.updateRange.count = this.count * sizeAttribute.itemSize;
                lifeTimeAttribute.updateRange.count = this.count * lifeTimeAttribute.itemSize;

            } else {

                positionStartAttribute.updateRange.offset = 0;
                startTimeAttribute.updateRange.offset = 0;
                velocityAttribute.updateRange.offset = 0;
                turbulenceAttribute.updateRange.offset = 0;
                colorAttribute.updateRange.offset = 0;
                sizeAttribute.updateRange.offset = 0;
                lifeTimeAttribute.updateRange.offset = 0;

                // Use -1 to update the entire buffer, see #11476
                positionStartAttribute.updateRange.count = -1;
                startTimeAttribute.updateRange.count = -1;
                velocityAttribute.updateRange.count = -1;
                turbulenceAttribute.updateRange.count = -1;
                colorAttribute.updateRange.count = -1;
                sizeAttribute.updateRange.count = -1;
                lifeTimeAttribute.updateRange.count = -1;

            }

            positionStartAttribute.needsUpdate = true;
            startTimeAttribute.needsUpdate = true;
            velocityAttribute.needsUpdate = true;
            turbulenceAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
            sizeAttribute.needsUpdate = true;
            lifeTimeAttribute.needsUpdate = true;

            this.offset = 0;
            this.count = 0;

        }

    };

    this.dispose = function() {

        this.particleShaderGeo.dispose();

    };

    this.init();

};
