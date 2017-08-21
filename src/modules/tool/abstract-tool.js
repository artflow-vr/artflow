'use strict';

let ThreeView = require( '../../view/three-view' );

function Tool( options ) {

    this.enabled = true;
    this.dynamic = false;

    this.localGroup = new ThreeView();
    this.worldGroup = new ThreeView();

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
    if ( this.onEnter !== undefined )
        Tool.prototype.onEnterChild = Tool.prototype._onEnter;
    if ( this.onExit !== undefined )
        Tool.prototype.onExitChild = Tool.prototype._onExit;

}

Tool.prototype.setOptionsIfUndef = function ( options ) {

    if ( options === undefined || options === null ) return;

    for ( let k in options ) {
        if ( !( k in this.options ) ) this.options[ k ] = options[ k ];
    }

};

Tool.prototype._update = function ( delta ) {

    if ( !this.enabled || !this.dynamic )
        return;

    if ( this.update ) this.update( delta );

};

Tool.prototype._use = function ( data ) {

    if ( !this.enabled )
        return;

    if ( this.use ) this.use( data );

};

Tool.prototype._trigger = function ( data ) {

    if ( !this.enabled )
        return undefined;

    if ( !this.trigger ) return undefined;

    return this.trigger( data );

};

Tool.prototype._release = function ( data ) {

    if ( !this.enabled )
        return undefined;

    if ( !this.release ) return undefined;

    return this.release( data );

};

Tool.prototype._onEnter = function () {

    this.onEnter();

};

Tool.prototype._onExit = function () {

    this.onExit();

};

module.exports = Tool;
