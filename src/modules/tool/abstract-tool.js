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

        // ID of the controller the tool is cur rently selected by.
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

    }

    setOptionsIfUndef( options ) {

        if ( options === undefined || options === null ) return;

        for ( let k in options )
            if ( !( k in this.options ) ) this.options[ k ] = options[ k ];

    }

    triggerEvent( eventID, data, status ) {

        if ( !this.enabled ) return;

        if ( !( eventID in this.listenTo ) ) return;

        let callback = this.listenTo[ eventID ];
        if ( !callback ) return;

        // The event is of the form:
        // {
        //      use: ...,
        //      trigger: ...,
        //      release: ...
        // }

        if ( typeof callback !== 'function' ) {
            if ( callback[ status ] ) callback[ status ]( data );
            return;
        }

        // The event is a function
        callback( data );

    }

    registerEvent( eventID, familyCallback ) {

        if ( eventID in this.listenTo ) {
            let warnMsg = 'The tool is already listening to \'' + eventID +
                '\'';
            console.warn( 'AbstractTool: registerEvent(): ' + warnMsg );
        }

        this.listenTo[ eventID ] = familyCallback;

    }

    _update( delta, controllerID ) {

        if ( !this.enabled || !this.dynamic || !this.update )
            return;

        this.update( delta, controllerID );

    }

    _onItemChanged( id ) {

        if ( !this.enabled || !this.onItemChanged ) return;

        this.onItemChanged( id );

    }

    _onEnter() {

        if ( !this.enabled || !this.onEnter ) return;

        this.onEnter();

    }

    _onExit() {

        if ( !this.enabled || !this.onExit ) return;

        this.onExit();

    }

}
