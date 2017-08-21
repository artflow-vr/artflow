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

    this._cursor_sphere = new THREE.Sphere(this.options.brush_size, this._position);
    this._cursor_mesh = new THREE.Mesh( this._cursor_sphere.geometry );

    this._cursor_mesh.castShadow = false;
    this._cursor_mesh.receiveShadow = false;

}
ParticleTool.prototype = Object.create( AbstractTool.prototype );
ParticleTool.prototype.constructor = ParticleTool;

ParticleTool.prototype.use = function ( data ) {

    this._update_brush( data.position.world );

};

ParticleTool.prototype._update_brush = function ( pointCoords ) {
    this._cursor_mesh.position.x = pointCoords.x;
    this._cursor_mesh.position.y = pointCoords.y;
    this._cursor_mesh.position.z = pointCoords.z;
};

ParticleTool.prototype.update = function () {};

ParticleTool.prototype.trigger = function () {

    this.view.addTHREEObject( this._cursor_mesh );

    return new AddCommand( this.view, this._cursor_mesh );
};

ParticleTool.prototype.release = function () { };

module.exports = ParticleTool;
