'use strict';

let AbstractTool = require( './abstract-tool' );

function ParticleTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        brush_size: 20,
        particles_thickness: 0.2
    } );

    // this._attribute = 0; TODO: attributes go there
    this._position = THREE.Vector3();
}

ParticleTool.prototype = Object.create( AbstractTool.prototype );
ParticleTool.prototype.constructor = ParticleTool;

BrushTool.prototype.use = function ( data ) {

    this._update_brush( data.position.world );

};

BrushTool.prototype._update_brush = function ( pointCoords ) {
    this._position.x = pointCoords.x;
    this._position.y = pointCoords.y;
    this._position.z = pointCoords.z;
    this._pointer_mesh.radius = this.options.brush_size;
};

ParticleTool.prototype.update = function () {};

ParticleTool.prototype.trigger = function () {

    let mesh = new THREE.Sphere( this.radius, this._material );

    mesh.castShadow = false;
    mesh.receiveShadow = false;

    this.view.addTHREEObject( mesh );

    return new AddCommand( this.view, mesh );
};

ParticleTool.prototype.release = function () { };
