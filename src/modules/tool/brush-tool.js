'use strict';

let AbstractTool = require( './abstract-tool' );

let BrushModel = require( '../../model/brush-model' );

function BrushTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        maxSpread: 50,
        brushThickness: 0.5
    } );

    this._brushModel = new BrushModel( 10000, this.options.texture );
    this._brushModel.initBrush();
    this.view.addTHREEObject( this._brushModel.mesh );

}
BrushTool.prototype = Object.create( AbstractTool.prototype );
BrushTool.prototype.constructor = BrushTool;

BrushTool.prototype.update = function ( delta ) {

    console.log( delta );

};

BrushTool.prototype.use = function ( data ) {

    if ( data.position )
        this._brushModel.addPoint( data.position );
};

BrushTool.prototype.trigger = function () {


};

BrushTool.prototype.release = function () {

    this._brushModel.initBrush();
    this.view.addTHREEObject( this._brushModel.mesh );

};

module.exports = BrushTool;
