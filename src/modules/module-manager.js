class Manager {

    constructor() {

        this._modules = {};

    }

    register( moduleID, mod ) {

        if ( moduleID in this._modules ) {
            let errorMsg = 'you already registered the module \'' +
                moduleID +
                '\'';
            throw Error( 'ToolModule: ' + errorMsg );
        }

        this._modules[ moduleID ] = mod;

    }

    init() {

        this._exec( 'init' );

    }

    update( data ) {

        this._exec( 'update', data );

    }

    resize( w, h ) {

        this._exec( 'resize', {
            w: w,
            h: h
        } );

    }

    _exec( callbackID, extraParams ) {

        for ( let k in this._modules ) {
            let m = this._modules[ k ];
            if ( callbackID in m ) m[ callbackID ]( extraParams );
        }

    }

}

export default new Manager();
