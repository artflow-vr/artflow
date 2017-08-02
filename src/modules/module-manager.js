'use strict';

let ModuleManager = module.exports;
let modules = {};

ModuleManager.register = function( id, mod ) {

    modules[ id ] = mod;

};

ModuleManager.init = function() {

    ModuleManager._exec( 'init' );

};

ModuleManager.update = function( delta ) {

    ModuleManager._exec( 'update', { delta: delta } );

};

ModuleManager.resize = function( w, h ) {

    ModuleManager._exec( 'resize', { w: w, h: h } );

};

ModuleManager._exec = function( callbackID, extraParams ) {

    for ( let k in modules ) {
        let m = modules[ k ];
        if ( callbackID in m ) m[ callbackID ]( extraParams );
    }

};
