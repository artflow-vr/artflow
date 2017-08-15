'use strict';

let ThreeView = require( '../../view/three-view' );

function Tool( options ) {

    this.enabled = true;
    this.dynamic = false;

    this.view = new ThreeView();

    this.options = {};

    for ( let k in options )
        this.options[ k ] = options[ k ];

    // Registers only method defined in the child
    if ( this.update !== undefined )
        Tool.prototype.updateChild = Tool.prototype._update;
    if ( this.use !== undefined )
        Tool.prototype.useChild = Tool.prototype._use;
    if ( this.trigger !== undefined )
        Tool.prototype.triggerChild = Tool.prototype._trigger;
    if ( this.release !== undefined )
        Tool.prototype.releaseChild = Tool.prototype._release;

}

Tool.prototype.setOptionsIfUndef = function ( options ) {

    if ( options === undefined || options === null ) return;

    for ( let k in options ) {
        if ( !( k in this.options ) ) this.options[ k ] = options[ k ];
    }

};

Tool.prototype.setVisible = function ( trigger ) {

    this.view.setVisible( trigger );

};


Tool.prototype._update = function ( delta ) {

    if ( !this.enabled || !this.dynamic )
        return;

    this.update( delta );

};

Tool.prototype._use = function ( data ) {

    if ( !this.enabled )
        return;

    this.use( data );

};

Tool.prototype._trigger = function ( data ) {

    if ( !this.enabled )
        return;

    this.trigger( data );

};

Tool.prototype._release = function ( data ) {

    if ( !this.enabled )
        return;

    this.release( data );

};

module.exports = Tool;
