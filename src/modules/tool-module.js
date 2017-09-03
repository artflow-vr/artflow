import * as Tool from './tool/tool';
import MainView from '../view/main-view';
import * as Utils from '../utils/utils';

let EventDispatcher = Utils.EventDispatcher;

class ToolModule {

    constructor() {

        // Contains every tool: brush, water, etc...
        // These tools are not instanciated, they represent only a blueprint.
        this._tools = {};
        this._instance = {};

        // Contains the tool for each controller. Whenever the user is not in VR,
        // only one tool is accessible at a time.
        this._selected = new Array( 2 );

        // General tools should be accessible every time, even if they are not
        // currently selected.
        this._generalTools = [];

        this.undoStack = [];
        this.redoStack = [];

        this.objectPool = null;

    }

    register( toolID, tool ) {

        if ( toolID in this._tools ) {
            let errorMsg = 'you already registered the tool \'' + toolID +
                '\'';
            throw Error( 'ToolModule: ' + errorMsg );
        }

        this._tools[ toolID ] = tool;

    }

    init() {

        this.objectPool = new Utils.ObjectPool();
        this._registerBasicTools();

        // TODO: We have to instanciate the tools according to what the user
        // selected. We should keep track of instanciated tool, to avoid
        // making useless instanciation.
        this._instance.brush0.controllerID = 0;
        this._selected[ 0 ] = this._instance.brush0;
        //this._selected[ 0 ] = this._instance.particle0;
        this._selected[ 1 ] = null;

        // TODO: Add onEnterChild & onExitChild event trigger.

        // Registers trigger event for any tool
        EventDispatcher.registerFamily( 'interact', this._getEventFamily(
            'interact' ) );

        EventDispatcher.register( 'undo', () => {

            if ( this.undoStack.length === 0 ) return;

            let cmd = this.undoStack.pop();
            cmd.undo();
            this.redoStack.push( cmd );

        } );

        EventDispatcher.register( 'redo', () => {

            if ( this.redoStack.length === 0 ) return;

            let cmd = this.redoStack.pop();
            cmd.redo();
            this.undoStack.push( cmd );

        } );

        // For efficiency reason, we will register particular events for general
        // tools, it will allow them to be accessible every time.
        // TODO: Look at the parameter 'general' when registering a tool, in
        // order to avoid hardcode this registering.
        this._generalTools.push( this._instance.teleporter );
        for ( let toolID in this._generalTools ) {
            let tool = this._generalTools[ toolID ];
            for ( let eventID in tool.listenTo ) {
                EventDispatcher.registerFamily(
                    eventID, tool.listenTo[ eventID ]
                );
            }
        }

    }

    update( data ) {

        let tool = null;
        for ( let toolID in this._instance ) {
            tool = this._instance[ toolID ];
            if ( tool.update ) tool.update( data );
        }

    }

    _getEventFamily( eventID ) {

        return {
            use: ( data ) => {

                this._selected[ data.controllerID ].triggerEvent(
                    eventID, 'use', data
                );

            },
            trigger: ( data ) => {

                let cmd = this._selected[ data.controllerID ].triggerEvent(
                    eventID, 'trigger', data
                );
                if ( cmd ) this.undoStack.push( cmd );

                for ( let i = this.redoStack.length - 1; i >= 0; --i ) {
                    let c = this.redoStack.pop();
                    if ( c.clear ) c.clear();
                }

            },
            release: ( data ) => {

                this._selected[ data.controllerID ].triggerEvent(
                    eventID, 'release', data
                );

            }
        };

    }

    _instanciate( instanceID, toolID, options ) {

        if ( !( toolID in this._tools ) ) {
            let errorMsg = 'Tool \'' + toolID + '\' is not registered yet.';
            throw Error( 'ToolModule._instanciate(): ' + errorMsg );
        }

        if ( instanceID in this._instance ) {
            let errorMsg = '\'' + instanceID + '\' already instanciated.';
            throw Error( 'ToolModule._instanciate(): ' + errorMsg );
        }

        let instance = new this._tools[ toolID ]( options );
        this._instance[ instanceID ] = instance;

        // Adds tool's view groups to the root scene and the moving group.
        MainView.addToMovingGroup( instance.worldGroup.getObject() );
        MainView.addToScene( instance.localGroup.getObject() );

    }

    _registerBasicTools() {

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

    }

}

export default new ToolModule();
