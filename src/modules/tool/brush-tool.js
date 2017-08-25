'use strict';

let BrushHelper = require( './helper/brush-helper' );
let AbstractTool = require( './abstract-tool' );

function BrushTool( options ) {

    AbstractTool.call( this, null );

    this.registeredBrushes = null;

    this._helper = new BrushHelper( options );

    // The code below links the teleporter method to the associated events.
    let self = this;
    this.registerEvent( 'interact', {
        use: self.use.bind( self ),
        trigger: self.trigger.bind( self )
    } );

}
BrushTool.prototype = Object.create( AbstractTool.prototype );
BrushTool.prototype.constructor = BrushTool;

BrushTool.prototype.update = function () {
    // TODO: Fills with dynamic brushes
};

BrushTool.prototype.use = function ( data ) {

    this._helper.addPoint( data.position.world, data.orientation, data.pressure );
};

BrushTool.prototype.trigger = function ( ) {

    return this._helper.trigger();

};

BrushTool.registeredBrushes = [
    {
        maxSpread: 20,
        brushThickness: 0.5,
        enablePressure: false,
        color: 0x808080,
        materialId: 'material_with_tex'
    },
    {
        maxSpread: 20,
        brushThickness: 0.5,
        texture: null,
        enablePressure: true,
        color: 0x808080,
        materialId: 'material_without_tex'
    }
];

module.exports = BrushTool;
