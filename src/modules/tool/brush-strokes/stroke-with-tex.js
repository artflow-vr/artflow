'use strict';

let AbstractBrushStroke = require( '../abstract-brush-stroke' );
let BrushHelper = require( '../helper/brush-helper' );

function StrokeWithTex( ) {

    AbstractBrushStroke.call( this, null );

    let options = {
        maxSpread: 20,
        brushThickness: 0.5,
        enablePressure: false,
        color: 0x808080,
        materialId: 'material_with_tex'
    };

    this._helper = new BrushHelper( options );

}
StrokeWithTex.prototype = Object.create( AbstractBrushStroke.prototype );
StrokeWithTex.prototype.constructor = StrokeWithTex;

module.exports = StrokeWithTex;
