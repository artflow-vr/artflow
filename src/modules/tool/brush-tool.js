'use strict';

let AbstractTool = require( './abstract-tool' );
let StrokeWithTex = require( './brush-strokes/stroke-with-tex' );
let StrokeWithoutTex = require( './brush-strokes/stroke-without-tex' );

function BrushTool( ) {

    AbstractTool.call( this, null );

    this.registeredStrokes = null;

    let self = this;
    this.registerEvent( 'interact', {
        use: self.use.bind( self ),
        trigger: self.trigger.bind( self )
    } );

    this.registeredStrokes = {
        with_tex : new StrokeWithTex(),
        without_tex : new StrokeWithoutTex()
    };

    this.currentStroke = 'with_tex';

}
BrushTool.prototype = Object.create( AbstractTool.prototype );
BrushTool.prototype.constructor = BrushTool;

BrushTool.prototype.setCurrentStroke = function ( id ) {

    this.currentStroke = id;

};

BrushTool.prototype.update = function () {

    for ( let s in this.registeredStrokes )
        this.registeredStrokes[ s ].update( {} );

};

BrushTool.prototype.use = function ( data ) {

    this.registeredStrokes[ this.currentStroke ].use( data );

};

BrushTool.prototype.trigger = function () {

    this.registeredStrokes[ this.currentStroke ].trigger( this );

};

module.exports = BrushTool;
