'use strict';

let Tool = require( './tool/tool' );

let MainView = require( '../view/main-view' );

let Utils = require( '../utils/utils' );
let EventDispatcher = Utils.EventDispatcher;
let AssetManager = Utils.AssetManager;

let ToolModule = module.exports;

// Contains every tool: brush, water, etc...
// These tools are not instanciated, they represent only a blueprint.
let _tools = {};
let _instance = {};

// Contains the tool for each controller. Whenever the user is not in VR,
// only one tool is accessible at a time.
let _selected = new Array( 2 );
let _teleporterTool = null;

let undoStack = [];
let redoStack = [];

ToolModule.register = function ( toolID, tool ) {

    if ( toolID in _tools ) {
        let errorMsg = 'you already registered the tool \'' + toolID + '\'';
        throw Error( 'ToolModule: ' + errorMsg );
    }

    _tools[ toolID ] = tool;

};

ToolModule.init = function () {

    this._registerBasicTools();

    _teleporterTool = _instance.teleporter;

    // TODO: We have to instanciate the tools according to what the user
    // selected. We should keep track of instanciated tool, to avoid
    // making useless instanciation.
    _instance.brush0.controllerID = 0;
    _selected[ 0 ] = _instance.brush0;
    _selected[ 1 ] = null;

    // TODO: Add onEnterChild & onExitChild event trigger.

    // Registers trigger event for any tool
    EventDispatcher.registerFamily( 'interact', {
        use: function ( data ) {

            _selected[ data.controllerID ].useChild( data );

        },
        down: function ( data ) {

            let cmd = _selected[ data.controllerID ].triggerChild(
                data );
            if ( cmd ) undoStack.push( cmd );

            for ( let i = redoStack.length - 1; i >= 0; --i ) {
                let c = redoStack.pop();
                if ( c.clear ) c.clear();
            }

        },
        up: function ( data ) {

            _selected[ data.controllerID ].releaseChild( data );

        }
    } );

    // Registers event for teleportation
    EventDispatcher.registerFamily( EventDispatcher.EVENTS.teleport, {
        use: _teleporterTool.use.bind( _teleporterTool ),
        down: _teleporterTool.trigger.bind( _teleporterTool ),
        up: _teleporterTool.release.bind( _teleporterTool )
    } );

    EventDispatcher.register( EventDispatcher.EVENTS.undo, function () {

        if ( undoStack.length === 0 ) return;

        let cmd = undoStack.pop();
        cmd.undo();
        redoStack.push( cmd );

    } );

    EventDispatcher.register( EventDispatcher.EVENTS.redo, function () {

        if ( redoStack.length === 0 ) return;

        let cmd = redoStack.pop();
        cmd.redo();
        undoStack.push( cmd );

    } );

};

ToolModule.update = function ( data ) {

    let tool = null;
    for ( let toolID in _instance ) {
        tool = _instance[ toolID ];
        if ( tool.update ) tool.update( data );
    }

};

ToolModule._instanciate = function ( instanceID, toolID, options ) {

    if ( !( toolID in _tools ) ) {
        let errorMsg = 'Tool \'' + toolID + '\' is not registered yet.';
        throw Error( 'ToolModule._instanciate(): ' + errorMsg );
    }

    if ( instanceID in _instance ) {
        let errorMsg = '\'' + instanceID + '\' already instanciated.';
        throw Error( 'ToolModule._instanciate(): ' + errorMsg );
    }

    let instance = new _tools[ toolID ]( options );
    _instance[ instanceID ] = instance;

    // Adds tool's view groups to the root scene and the moving group.
    MainView.addToMovingGroup( instance.worldGroup.getObject() );
    MainView.addToScene( instance.localGroup.getObject() );

};

ToolModule._registerBasicTools = function () {

    this.register( 'Brush', Tool.BrushTool );
    this.register( 'Teleporter', Tool.TeleporterTool );

    this._instanciate( 'brush0', 'Brush', {
        texture: AssetManager.assets.texture.brush1
    } );
    this._instanciate( 'teleporter', 'Teleporter' );

};
