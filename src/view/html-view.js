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

export default class HTMLView {

    constructor( dataStyle ) {

        this._container = document.createElement( 'div' );
        this._displayStyleValue = 'block';

        if ( dataStyle ) this.applyDataStyle( dataStyle );
    }

    addChild( htmlView ) {

        if ( htmlView === undefined || htmlView === null ) {
            let errorMsg = 'addChild() called with a null/undefined value.';
            throw Error( 'HTMLView: ' + errorMsg );
        }
        if ( !( htmlView instanceof HTMLView ) ) {
            let errorMsg = 'addChild() has been called with a wrong type. ';
            errorMsg += 'Use HTMLView or make your own DOM appendChild().';
            throw Error( 'HTMLView: ' + errorMsg );
        }

        this._container.appendChild( htmlView.getDOMElement() );

    }

    setProp( propID, value ) {

        this._container[ propID ] = value;

    }

    setStyleProp( propID, value ) {

        if ( propID === 'display' ) this._displayStyleValue = value;
        this._container.style[ propID ] = value;

    }

    applyDataStyle( dataStyle ) {

        for ( let k in dataStyle ) {
            if ( k in this._container.style )
                this._container.style[ k ] = dataStyle[ k ];
        }

    }

    toggleVisibility( trigger ) {

        if ( trigger )
            this._container.style.display = this._displayStyleValue;
        else
            this._container.style.display = 'none';

    }

    getDOMElement() {

        return this._container;

    }

}
