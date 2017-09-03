import * as Artflow from './artflow';

let ModuleManager = Artflow.modules.ModuleManager;
let ControlModule = Artflow.modules.ControlModule;
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

    init( w, h ) {

        this._renderer.setPixelRatio( window.devicePixelRatio );
        this._renderer.setSize( w, h );
        document.body.appendChild( this._renderer.domElement );

        AssetManager.init().then( () => {

                WebVR.checkAvailability().then( () => {

                        WebVR.getVRDisplay( ( display ) => {

                            document.body.appendChild(
                                WebVR.getButton(
                                    display,
                                    this._renderer.domElement
                                )
                            );
                            this._renderer.vr.enabled =
                                true;
                            this._renderer.vr.standing =
                                true;
                            this._renderer.vr.setDevice(
                                display );

                            ControlModule.vr = true;
                            this._initData( w, h );

                        } );

                    } )
                    .catch( ( message ) => {

                        document.body.appendChild(
                            WebVR.getMessageContainer( message )
                        );
                        this._initData( w, h );

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

    _initData( w, h ) {

        MainView.init( w, h, this._renderer, ControlModule.vr );
        ModuleManager.init();

        this.resize( w, h );
        this._renderer.animate( this._animate.bind( this ) );

    }

}

export default new Main();
