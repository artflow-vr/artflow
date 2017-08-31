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

// General tools should be accessible every time, even if they are not
// currently selected.
let _generalTools = [];

let undoStack = [];
let redoStack = [];

this.ObjectPool = null;

/**
 * Registers a new tool into the tools library.
 *
 * @param  {String} toolID ID you want to give to the tool. e.g: 'Teleporter'.
 * @param  {Object} tool Object containing information on the tools. e.g:
 * {
 *     tool: [tool_constructor],
 *     options: [options_displayed_in_ui],
 *     general: [flag_generalt_tool],
 *     ...
 * }
 */
ToolModule.register = function ( toolID, tool ) {

    if ( toolID in _tools ) {
        let errorMsg = 'you already registered the tool \'' + toolID + '\'';
        throw Error( 'ToolModule: ' + errorMsg );
    }

    _tools[ toolID ] = tool;

};

ToolModule.init = function () {

    this.ObjectPool = new Utils.ObjectPool();

    this._registerBasicTools();

    // TODO: We have to instanciate the tools according to what the user
    // selected. We should keep track of instanciated tool, to avoid
    // making useless instanciation.
    _instance.brush0.controllerID = 0;
    _selected[ 0 ] = _instance.brush0;
    //_selected[ 0 ] = _instance.particle0;
    _selected[ 1 ] = null;

    // TODO: Add onEnterChild & onExitChild event trigger.

    // Registers trigger event for any tool
    EventDispatcher.registerFamily( 'interact', this._getEventFamily(
        'interact' ) );

    EventDispatcher.register( 'undo', function () {

        if ( undoStack.length === 0 ) return;

        let cmd = undoStack.pop();
        cmd.undo();
        redoStack.push( cmd );

    } );

    EventDispatcher.register( 'redo', function () {

        if ( redoStack.length === 0 ) return;

        let cmd = redoStack.pop();
        cmd.redo();
        undoStack.push( cmd );

    } );

    // For efficiency reason, we will register particular events for general
    // tools, it will allow them to be accessible every time.
    // TODO: Look at the parameter 'general' when registering a tool, in
    // order to avoid hardcode this registering.
    _generalTools.push( _instance.teleporter );
    for ( let toolID in _generalTools ) {
        let tool = _generalTools[ toolID ];
        for ( let eventID in tool.listenTo ) {
            EventDispatcher.registerFamily( eventID, tool.listenTo[ eventID ] );
        }
    }

};

/**
 * Updates every *instanciated* tools.
 *
 * @param  {Object} data Data provided by the ModuleManager.
 */
ToolModule.update = function ( data ) {

    let tool = null;
    for ( let toolID in _instance ) {
        tool = _instance[ toolID ];
        if ( tool.update ) tool.update( data );
    }

};

ToolModule._getEventFamily = function ( eventID ) {

    return {
        use: function ( data ) {

            _selected[ data.controllerID ].triggerEvent( eventID, 'use',
                data );

        },
        trigger: function ( data ) {

            let cmd = _selected[ data.controllerID ].triggerEvent(
                eventID, 'trigger', data );
            if ( cmd ) undoStack.push( cmd );

            for ( let i = redoStack.length - 1; i >= 0; --i ) {
                let c = redoStack.pop();
                if ( c.clear ) c.clear();
            }

        },
        release: function ( data ) {

            _selected[ data.controllerID ].triggerEvent( eventID,
                'release', data );

        }
    };

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
    this.register( 'Particle', Tool.ParticleTool );
    this.register( 'Teleporter', Tool.TeleporterTool );
    this.register( 'Water', Tool.WaterTool );

    this._instanciate( 'brush0', 'Brush', {
        materialId: 'material_with_tex'
    } );


    this._instanciate( 'particle0', 'Particle' );
    this._instanciate( 'teleporter', 'Teleporter' );
    this._instanciate( 'water', 'Water' );

};
