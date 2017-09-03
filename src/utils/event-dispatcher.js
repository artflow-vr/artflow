class EventDispatcher {

    constructor() {

        this._events = {};

    }

    register( eventID, callback ) {

        if ( this._events[ eventID ] === undefined ||
            this._events[ eventID ] === null ) {
            this._events[ eventID ] = [];
        }

        this._events[ eventID ].push( callback );

    }

    registerFamily( eventID, callbacks ) {

        this.register( eventID, callbacks.use );
        this.register( eventID + 'Up', callbacks.release );
        this.register( eventID + 'Down', callbacks.trigger );

    }

    dispatch( eventID, data ) {

        let events = this._events[ eventID ];
        if ( events === undefined || events === null ) return;

        for ( let callbackID in events ) events[ callbackID ]( data );

    }

}

export default new EventDispatcher();
