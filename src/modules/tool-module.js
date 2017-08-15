'use strict';

let Tool = require( './tool/tool' );

let MainView = require( '../view/main-view' );

let Utils = require( '../utils/utils' );
let EventDispatcher = Utils.EventDispatcher;

let ToolModule = module.exports;

// Contains every tool: brush, water, etc...
// These tools are not instanciated, they represent only a blueprint.
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

    this._registerBasicTools();

    // TODO: We have to instanciate the tools according to what the user
    // selected. We should keep track of instanciated tool, to avoid
    // making useless instanciation.
    _selected[ 0 ] = new _tools.Brush();
    _selected[ 1 ] = null;

    MainView.addToMovingGroup( _selected[ 0 ].view.getObject() );

    EventDispatcher.register( 'interactDown', function ( data ) {

        if ( _selected[ data.controllerID ].triggerChild )
            _selected[ data.controllerID ].triggerChild( data );

    } );

    EventDispatcher.register( 'interactUp', function ( data ) {

        if ( _selected[ data.controllerID ].releaseChild )
            _selected[ data.controllerID ].releaseChild( data );

    } );

    EventDispatcher.register( 'interact', function ( data ) {

        if ( _selected[ data.controllerID ].useChild )
            _selected[ data.controllerID ].useChild( data );

    } );

};

ToolModule.update = function ( delta ) {

    if ( _selected[ 0 ] && _selected[ 0 ].updateChild )
        _selected[ 0 ].updateChild( delta );

    if ( _selected[ 1 ] && _selected[ 1 ].updateChild )
        _selected[ 1 ].updateChild( delta );

};

ToolModule._registerBasicTools = function () {

    this.register( 'Brush', Tool.BrushTool );

};
