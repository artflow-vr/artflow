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

class Manager {

    constructor() {

        this._modules = {};

    }

    register( moduleID, mod ) {

        if ( moduleID in this._modules ) {
            let errorMsg = 'you already registered the module \''
                            + moduleID + '\'';
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
