'use strict';

let AbstractTool = require( './abstract-tool' );

function ParticleTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        speed: 100
    } );

}
ParticleTool.prototype = Object.create( AbstractTool.prototype );
ParticleTool.prototype.constructor = ParticleTool;

ParticleTool.prototype.update = function () { };

ParticleTool.prototype.trigger = function () { };

ParticleTool.prototype.release = function () { };
