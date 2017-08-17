'use strict';

let AbstractTool = require( './abstract-tool' );

function WaterTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        speed: 100
    } );

}
WaterTool.prototype = Object.create( AbstractTool.prototype );
WaterTool.prototype.constructor = WaterTool;

WaterTool.prototype.update = function () { };

WaterTool.prototype.trigger = function () { };

WaterTool.prototype.release = function () { };
