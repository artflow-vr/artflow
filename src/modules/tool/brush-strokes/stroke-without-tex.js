'use strict';

let AbstractBrushStroke = require( '../abstract-brush-stroke' );
let BrushHelper = require( '../helper/brush-helper' );

function StrokeWithoutTex( ) {

    AbstractBrushStroke.call( this, null );

    let options = {
        maxSpread: 20,
        brushThickness: 0.5,
        enablePressure: false,
        color: 0x808080,
        materialId: 'material_without_tex'
    };

    this._helper = new BrushHelper( options );

}
StrokeWithoutTex.prototype = Object.create( AbstractBrushStroke.prototype );
StrokeWithoutTex.prototype.constructor = StrokeWithoutTex;

module.exports = StrokeWithoutTex;
