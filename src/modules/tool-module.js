'use strict';

let Utils = require( '../utils/utils' );
let EventDispatcher = Utils.EventDispatcher;

let ToolModule = module.exports;

// Contains every tool: brush, water, etc...
let _tools = {};

// Contains the tool for each controller. Whenever the user is not in VR,
// only one tool is accessible at a time.
let _selected = new Array( 2 );

// let _operations = [];

ToolModule.register = function ( toolID, tool ) {

    if ( toolID in _tools ) {
        let errorMsg = 'you already registered the tool \'' + toolID + '\'';
        throw Error( 'ToolModule: ' + errorMsg );
    }

    _tools[ toolID ] = tool;

};

ToolModule.init = function () {

    _selected[ 0 ] = null;
    _selected[ 1 ] = null;

    EventDispatcher.register( 'interactDown', function () {} );

    EventDispatcher.register( 'interactUp', function () {} );

    EventDispatcher.register( 'undo', function () {
        // TODO: Handles undo by keeping operations and their order.
    } );

    EventDispatcher.register( 'redo', function () {
        // TODO: Handles redo by keeping operations and their order.
    } );

};

ToolModule.update = function ( delta ) {

    if ( _selected[ 0 ] ) _selected[ 0 ].update( delta );

    if ( _selected[ 1 ] ) _selected[ 1 ].update( delta );

};
