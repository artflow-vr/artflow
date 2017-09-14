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


export class ParticleContainer extends THREE.Object3D {
    constructor( maxParticles, particleSystem ) {
        super();
        // THREE.Object3D.apply( this, arguments );

        this.PARTICLE_COUNT = maxParticles || 100000;
        this.PARTICLE_CURSOR = 0;
        this.time = 0;
        this.offset = 0;
        this.count = 0;
        this.DPR = window.devicePixelRatio;
        this.particleSystem = particleSystem;
        this.particleUpdate = false;

        // geometry

        this.particleShaderGeo = new THREE.BufferGeometry();

        this.particleShaderGeo.addAttribute( 'positionStart', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
        this.particleShaderGeo.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );

        // material

        this.particleShaderMat = this.particleSystem.particleShaderMat;

        this.position.set( new THREE.Vector3() );
        this.color = new THREE.Color();

        this.init();
    }

    spawnParticle( options = {} ) {
        let positionStartAttribute = this.particleShaderGeo.getAttribute( 'positionStart' );
        let colorAttribute = this.particleShaderGeo.getAttribute( 'color' );

        // setup reasonable default values for all arguments

        this.position.set( options.position !== undefined ? this.position.copy( options.position ) : 0, 0, 0 );
        this.color = options.color !== undefined ? this.color.set( options.color ) : this.color.set( 0xffffff );

        let positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0;
        let colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1;

        let i = this.PARTICLE_CURSOR;

        // position

        positionStartAttribute.array[ i * 3 ] = this.position.x + ( this.particleSystem.getRandom() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 1 ] = this.position.y + ( this.particleSystem.getRandom() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 2 ] = this.position.z + ( this.particleSystem.getRandom() * positionRandomness );

        // color

        this.color.r = THREE.Math.clamp( this.color.r + this.particleSystem.getRandom() * colorRandomness, 0, 1 );
        this.color.g = THREE.Math.clamp( this.color.g + this.particleSystem.getRandom() * colorRandomness, 0, 1 );
        this.color.b = THREE.Math.clamp( this.color.b + this.particleSystem.getRandom() * colorRandomness, 0, 1 );
        colorAttribute.array[ i * 3 ] = this.color.r;
        colorAttribute.array[ i * 3 + 1 ] = this.color.g;
        colorAttribute.array[ i * 3 + 2 ] = this.color.b;

        // offset

        if ( this.offset === 0 )
            this.offset = this.PARTICLE_CURSOR;

        // counter and cursor

        this.count++;
        this.PARTICLE_CURSOR++;

        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT )
            this.PARTICLE_CURSOR = 0;

        this.particleUpdate = true;
    }

    init() {
        this.particleGeometry = new THREE.Points( this.particleShaderGeo, this.particleShaderMat );
        this.particleGeometry.frustumCulled = false;
        super.add( this.particleGeometry );
    }

    update( time ) {
        /*
        this.time = time;
        this.particleShaderMat.uniforms.uTime.value = time;

        this.geometryUpdate();
        */
    }

    geometryUpdate() {
        if ( this.particleUpdate === true ) {
            this.particleUpdate = false;
            let positionStartAttribute = this.particleShaderGeo.getAttribute( 'positionStart' );
            let colorAttribute = this.particleShaderGeo.getAttribute( 'color' );
            if ( this.offset + this.count < this.PARTICLE_COUNT ) {
                positionStartAttribute.updateRange.offset = this.offset * positionStartAttribute.itemSize;
                colorAttribute.updateRange.offset = this.offset * colorAttribute.itemSize;
                positionStartAttribute.updateRange.count = this.count * positionStartAttribute.itemSize;
                colorAttribute.updateRange.count = this.count * colorAttribute.itemSize;
            } else {
                positionStartAttribute.updateRange.offset = 0;
                colorAttribute.updateRange.offset = 0;
                // Use -1 to update the entire buffer, see #11476
                positionStartAttribute.updateRange.count = -1;
                colorAttribute.updateRange.count = -1;
            }
            positionStartAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
            this.offset = 0;
            this.count = 0;
        }
    }

    dispose() {
        this.particleShaderGeo.dispose();
    }

}

export default class ParticleTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.setOptionsIfUndef( {
            brushSize: 1,
            thickness: 10
        } );
        this._brushSize = this.options.brushSize;
        this._thickness = this.options.thickness;
        this.PARTICLE_CONTAINERS = 1;
        this.PARTICLES_PER_CONTAINER = 100000;
        this.PARTICLE_CURSOR = 0;
        this.PARTICLE_COUNT = 0;

        // Initializing particles
        this._particleTexture = AssetManager.assets.texture.particle_raw;
        this.time = 0;
        this.particleContainers = [];
        this.rand = [];
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
                tSprite: {
                    value: this._particleTexture
                }
            },
            blending: THREE.AdditiveBlending,
            vertexShader: ParticleShader.vertex,
            fragmentShader: ParticleShader.fragment
        } );

        this.particleShaderMat.defaultAttributeValues.particlePositionsStartTime = [ 0, 0, 0, 0 ];
        this.particleShaderMat.defaultAttributeValues.particleVelColSizeLife = [ 0, 0, 0, 0 ];

        this.initCursorMesh();

        // preload a million random numbers
        this._randomIndex = 0;
        for ( this._randomIndex = 1e5; this._randomIndex > 0; this._randomIndex-- ) {
            this.rand.push( Math.random() - 0.5 );
        }

        // Bind functions to events
        let self = this;
        this.registerEvent( 'interact', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self ),
            release: self.release.bind( self )
        } );

        this.initParticleContainers();
    }

    initParticleContainers() {
        for ( let i = 0; i < this.PARTICLE_CONTAINERS; i ++ ) {
            let c = new ParticleContainer( this.PARTICLES_PER_CONTAINER, this );
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

    spawnParticle() {
        this.PARTICLE_CURSOR ++;
        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT )
            this.PARTICLE_CURSOR = 1;
        let currentContainer = this.particleContainers[ Math.floor( this.PARTICLE_CURSOR / this.PARTICLES_PER_CONTAINER ) ];
        currentContainer.spawnParticle( this.options );
    }

    use( data ) {
        this._updateBrush( data.position.world );
        this.spawnParticle();
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
        this.particleSpriteTex.dispose();
        for ( let i = 0; i < this.PARTICLE_CONTAINERS; i ++ )
            this.particleContainers[ i ].dispose();
    }

    trigger() {
        // this.worldGroup.addTHREEObject( this._cursorMesh );
    }

    release() {}

}
