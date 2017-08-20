'use strict';

let AbstractTool = require( './abstract-tool' );

let AddCommand = require( './command/add-command' );

function ParticleTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        brush_size: 20,
        particles_thickness: 0.2
    } );

    // this._attribute = 0; TODO: attributes go there
    this._position = new THREE.Vector3(0, 0, 0);

}
ParticleTool.prototype = Object.create( AbstractTool.prototype );
ParticleTool.prototype.constructor = ParticleTool;

ParticleTool.prototype.use = function ( data ) {

    this._update_brush( data.position.world );

};

ParticleTool.prototype._update_brush = function ( pointCoords ) {
    this._position.x = pointCoords.x;
    this._position.y = pointCoords.y;
    this._position.z = pointCoords.z;
};

ParticleTool.prototype.update = function () {};

ParticleTool.prototype.trigger = function () {

    let mesh = new THREE.Mesh( new THREE.Sphere(this.options.brush_size, this._position).geometry );

    mesh.castShadow = false;
    mesh.receiveShadow = false;

    this.view.addTHREEObject( mesh );

    return new AddCommand( this.view, mesh );
};

ParticleTool.prototype.release = function () { };

module.exports = ParticleTool;
