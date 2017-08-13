'use strict';

let ModuleManager = module.exports;

let _modules = {};

ModuleManager.register = function ( moduleID, mod ) {

    if ( moduleID in _modules ) {
        let errorMsg = 'you already registered the module \'' + moduleID +
            '\'';
        throw Error( 'ToolModule: ' + errorMsg );
    }

    _modules[ moduleID ] = mod;

};

ModuleManager.init = function () {

    ModuleManager._exec( 'init' );

};

ModuleManager.update = function ( delta ) {

    ModuleManager._exec( 'update', {
        delta: delta
    } );

};

ModuleManager.resize = function ( w, h ) {

    ModuleManager._exec( 'resize', {
        w: w,
        h: h
    } );

};

ModuleManager._exec = function ( callbackID, extraParams ) {

    for ( let k in _modules ) {
        let m = _modules[ k ];
        if ( callbackID in m ) m[ callbackID ]( extraParams );
    }

};
