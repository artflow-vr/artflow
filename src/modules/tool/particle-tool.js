'use strict';

let THREE = window.THREE;

let AbstractTool = require( './abstract-tool' );

let AddCommand = require( './command/add-command' );

let AssetManager = require( '../../utils/asset-manager' );

function ParticleTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        brush_size: 1,
        particles_thickness: 2
    } );

    this._position = new THREE.Vector3( 0, 0, 0 );

    this._cursor_mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.options.brush_size, 16, 16, 0, Math.PI * 2, 0, Math.PI * 2),
        new THREE.MeshBasicMaterial({
            color: 0xfff0000,
            wireframe: true
        })
    );

    this._cursor_mesh.castShadow = false;
    this._cursor_mesh.receiveShadow = false;

    // Initializing particles
    this._particle_texture = AssetManager.assets.texture.particle_raw;
    this._particleCount = this.options.brush_size * this.options.particles_thickness;
    this._pMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            map: this._particle_texture,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

    this.worldGroup.addTHREEObject( this._cursor_mesh );

}
ParticleTool.prototype = Object.create( AbstractTool.prototype );
ParticleTool.prototype.constructor = ParticleTool;

ParticleTool.prototype.use = function ( data ) {
    this._update_brush( data.position.world );

    // Create the particles
    var particles = new THREE.Geometry();
    for (var p = 0; p < this._particleCount; p++) {

        // create a particle with random
        // position values, -250 -> 250
        var offsetX = Math.random() * this.options.brush_size - this.options.brush_size / 2,
            offsetY = Math.random() * this.options.brush_size - this.options.brush_size / 2,
            offsetZ = Math.random() * this.options.brush_size - this.options.brush_size / 2,
            particle =
                new THREE.Vector3(
                    this._cursor_mesh.position.x + offsetX,
                    this._cursor_mesh.position.y + offsetY,
                    this._cursor_mesh.position.z + offsetZ
                );

        // add it to the geometry
        particles.vertices.push(particle);
    }

    // create the particle system
    var particleSystem = new THREE.Points(
        particles,
        this._pMaterial);

    // add it to the scene
    this.worldGroup.addTHREEObject(particleSystem);
};

ParticleTool.prototype._update_brush = function ( pointCoords ) {
    this._cursor_mesh.position.x = pointCoords.x;
    this._cursor_mesh.position.y = pointCoords.y;
    this._cursor_mesh.position.z = pointCoords.z;
};

ParticleTool.prototype.update = function () {};

ParticleTool.prototype.trigger = function () {
    //return new AddCommand( this.view, this._cursor_mesh );
};

ParticleTool.prototype.release = function () { };

module.exports = ParticleTool;
