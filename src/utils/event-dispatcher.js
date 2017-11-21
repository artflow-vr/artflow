/**
* ArtFlow application
* https://github.com/artflow-vr/artflow
*
* MIT License
*
* Copyright (c) 2017 artflow
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

class EventDispatcher {

    constructor() {

        const MAX_NB_PRIORITY = 3;
        // Array containing, for each priority, a list of items that
        // contain a list of callbacks.
        this._events = new Array( MAX_NB_PRIORITY );
        for ( let i = 0; i < MAX_NB_PRIORITY; ++i ) this._events[ i ] = {};

        //this._stoppedEvents = {};

    }

    register( eventID, callback, priority = 0 ) {

        if ( !callback ) {
            let warnMsg = 'trying to register `' + eventID + '\' with undefined callback';
            console.warn( 'EventDispatcher.register(): ' + warnMsg );
            return;
        }

        if ( this._events[ priority ][ eventID ] === undefined ||
            this._events[ priority ][ eventID ] === null ) {
            this._events[ priority ][ eventID ] = [];
        }

        this._events[ priority ][ eventID ].push( callback );
        //this._stoppedEvents[ priority ][ eventID ] = false;

    }

    registerFamily( eventID, callbacks, priority = 0 ) {

        if ( callbacks.use )
            this.register( eventID, callbacks.use, priority );
        if ( callbacks.release )
            this.register( eventID + 'Up', callbacks.release, priority );
        if ( callbacks.trigger )
            this.register( eventID + 'Down', callbacks.trigger,priority );

    }

    dispatch( eventID, data ) {

        let stopProp = false;

        for ( let priority of this._events ) {
            let events = priority[ eventID ];
            if ( events === undefined || events === null ) continue;

            for ( let callback of events ) {
                let ret = callback( data );
                stopProp = ret !== undefined && !ret;
            }

            if ( stopProp ) return;
        }

    }

    stopPropagation( eventID ) {

        this._stoppedEvents[ eventID ] = true;

    }

    enablePropagation( eventID ) {

        this._stoppedEvents[ eventID ] = false;

    }

}

export default new EventDispatcher();
