'use strict';

let ModuleManager = module.exports;

ModuleManager._modules = {};

ModuleManager.register = function ( moduleID, mod ) {

    if ( moduleID in ModuleManager._modules ) {
        let errorMsg = 'you already registered the module \'' + moduleID +
            '\'';
        throw Error( 'ToolModule: ' + errorMsg );
    }

    ModuleManager._modules[ moduleID ] = mod;

};

ModuleManager.init = function () {

    ModuleManager._exec( 'init' );

};

ModuleManager.update = function ( data ) {

    ModuleManager._exec( 'update', data );

};

ModuleManager.resize = function ( w, h ) {

    ModuleManager._exec( 'resize', {
        w: w,
        h: h
    } );

};

ModuleManager._exec = function ( callbackID, extraParams ) {

    for ( let k in ModuleManager._modules ) {
        let m = ModuleManager._modules[ k ];
        if ( callbackID in m ) m[ callbackID ]( extraParams );
    }

};
