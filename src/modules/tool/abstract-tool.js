import ThreeView from '../../view/three-view';

export default class Tool {

    constructor( options ) {

        // Whenener enabled is false, the listened events will not be called
        // as well as the update() method.
        this.enabled = true;
        // Whenever dynamic is false, the listeneted events are still triggered,
        // but the update() method is not called.
        this.dynamic = false;

        // Contains the Three.js objects that should be added to MainView._group.
        // The objects will be in a local frame, just-like the camera is when
        // the user move arround in its VR-home. Objects in the localGroup are not
        // teleportation.
        this.localGroup = new ThreeView();
        // Contains the Three.js objects that should be added to
        // MainView._rootScene. The objects will be in a world frame, and are
        // affected by teleportation.
        this.worldGroup = new ThreeView();

        // ID of the controller the tool is currently selected by.
        this.controllerID = -1;

        // Contains options that can be modified in the UI. eg:
        // { speed: 100.0, texture: null, ...}
        this.options = {};

        for ( let k in options )
            this.options[ k ] = options[ k ];

        // Stores all events registered by the tool. e.g:
        /*
            {
                interact: {
                    trigger: [callback_interact_button_down],
                    release: [callback_interact_button_up],
                    use: [callback_interact]
                }
            }
        }*/
        this.listenTo = {};

        // Registers only method defined in the child
        if ( this.update !== undefined )
            Tool.prototype.updateChild = Tool.prototype._update;
        if ( this.onEnter !== undefined )
            Tool.prototype.onEnterChild = Tool.prototype._onEnter;
        if ( this.onExit !== undefined )
            Tool.prototype.onExitChild = Tool.prototype._onExit;

    }

    setOptionsIfUndef( options ) {

        if ( options === undefined || options === null ) return;

        for ( let k in options ) {
            if ( !( k in this.options ) ) this.options[ k ] = options[ k ];
        }

    }

    triggerEvent( eventID, status, data ) {

        if ( !this.enabled ) return;

        if ( !( eventID in this.listenTo ) ) return;

        // console.log( 'called' );

        let callback = this.listenTo[ eventID ][ status ];
        if ( callback ) callback( data );

    }

    registerEvent( eventID, familyCallback ) {

        if ( eventID in this.listenTo ) {
            let warnMsg = 'The tool is already listening to \'' + eventID +
                '\'';
            console.warn( 'AbstractTool: registerEvent(): ' + warnMsg );
        }

        this.listenTo[ eventID ] = familyCallback;

    }

    _update( delta ) {

        if ( !this.enabled || !this.dynamic )
            return;

        this.update( delta );

    }

    _onEnter() {

        this.onEnter();

    }

    _onExit() {

        this.onExit();

    }

}
