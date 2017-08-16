'use strict';

let EventDispatcher = module.exports;

EventDispatcher.EVENTS = {

    interact: 'interact',
    teleport: 'teleport',
    undo: 'undo',
    redo: 'redo'

};

EventDispatcher._events = {};

EventDispatcher.register = function ( eventID, callback ) {

    if ( this._events[ eventID ] === undefined || this._events[ eventID ] ===
        null ) {
        this._events[ eventID ] = [];
    }

    this._events[ eventID ].push( callback );

};

EventDispatcher.registerFamily = function ( eventID, callbacks ) {

    EventDispatcher.register( eventID, callbacks.use );
    EventDispatcher.register( eventID + 'Up', callbacks.up );
    EventDispatcher.register( eventID + 'Down', callbacks.down );

};

EventDispatcher.dispatch = function ( eventID, data ) {

    let events = this._events[ eventID ];
    if ( events === undefined || events === null ) return;

    for ( let callbackID in events ) events[ callbackID ]( data );

};
