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
import * as Artflow from './artflow';

let ModuleManager = Artflow.modules.ModuleManager;
let ControlModule = Artflow.modules.ControlModule;
let ToolModule = Artflow.modules.ToolModule;
let AssetManager = Artflow.utils.AssetManager;
let MainView = Artflow.view.MainView;
let WebVR = Artflow.vr.WebVR;

class Main {

    constructor() {

        this._renderer = new THREE.WebGLRenderer( {
            antialias: true
        } );

        this._clock = new THREE.Clock();

        this._updateData = {
            delta: 0.0,
            controllers: [ null, null ]
        };

    }

    init( w, h, callback ) {

        this._renderer.setPixelRatio( window.devicePixelRatio );
        this._renderer.setSize( w, h );
        document.body.appendChild( this._renderer.domElement );

        AssetManager.init().then( () => {

            WebVR.checkAvailability().then( () => {

                WebVR.getVRDisplay( ( display ) => {

                    document.body.appendChild(
                        WebVR.getButton( display,this._renderer.domElement )
                    );
                    this._renderer.vr.enabled = true;
                    this._renderer.vr.standing = true;
                    this._renderer.vr.setDevice( display );
                    ModuleManager.vr = true;
                    this._initData( w, h, callback );

                } );

            } )
            .catch( ( message ) => {

                document.body.appendChild(
                    WebVR.getMessageContainer( message )
                );
                this._initData( w, h, callback );

            } );

        } )
        .catch( ( error ) => {

            throw Error( error );

        } );

    }

    resize( w, h ) {

        ModuleManager.resize( w, h );
        MainView.resize( w, h );
        this._renderer.setSize( w, h );

    }

    _update() {

        let controllers = ControlModule.getControllersData();

        this._updateData.delta = this._clock.getDelta();
        this._updateData.controllers[ 0 ] = controllers[ 0 ];
        this._updateData.controllers[ 1 ] = controllers[ 1 ];

        ModuleManager.update( this._updateData );

    }

    _render() {

        MainView.render();

    }

    _animate() {

        this._update();
        this._render();

    }

    _initData( w, h, callback ) {

        MainView.init( w, h, this._renderer, ModuleManager.vr );
        ModuleManager.init();

        // Gives an access to the controllers for modules needing it.
        ToolModule.setControllerRef( ControlModule._controllers );

        this.resize( w, h );
        this._renderer.animate( this._animate.bind( this ) );

        if ( callback ) callback( Artflow.modules, MainView );

    }

}

export default new Main();
