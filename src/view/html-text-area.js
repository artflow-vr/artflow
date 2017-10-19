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

import HTMLView from './html-view';

export default class HTMLTextArea extends HTMLView {

    constructor( message, dataStyle = null, useArtflowDefault = true ) {

        super();

        if ( message !== undefined && message !== null )
            this._container.innerHTML = message;

        if ( useArtflowDefault ) this._useDefaultValues();

        // Applies the selected style after applying default values.
        // Use HTMLView constructor would override the user given style.
        if ( dataStyle ) this.applyDataStyle( dataStyle );

    }

    setMessage( message ) {

        if ( message === undefined || message === null ) {
            let errorMsg = 'no message provided or has a null value.';
            throw Error( 'HTMLTextArea: ' + errorMsg );
        }
        this._container.innerHTML = message;

    }

    _useDefaultValues() {

        this._container.style.fontFamily = 'sans-serif';
        this._container.style.fontSize = '16px';
        this._container.style.fontStyle = 'normal';
        this._container.style.lineHeight = '26px';
        this._container.style.backgroundColor = '#fff';
        this._container.style.color = '#000';
        this._container.style.padding = '10px 20px';
        this._container.style.display = 'inline-block';

    }

}
