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

import MainView from '../view/main-view';

class ToolContainer {

    constructor() {
        this._tools = {};
        this._register = {};
        this.toolIcon = null;
        this.selected = 0;
    }

    register( toolID, tool, options ) {

        if ( toolID in this._tools ) {
            let errorMsg = 'you already registered the tool variant \'' + toolID +
                '\'';
        throw Error( 'ToolContainer: ' + errorMsg );
        }

        this._register.push( toolID );
        let instance = new this._tools[ toolID ]( options );
        this._tools.push( instance );

        // Adds tool's view groups to the root scene and the moving group.
        MainView.addToMovingGroup( instance.worldGroup.getObject() );
        MainView.addToScene( instance.localGroup.getObject() );

    }

    update( data ) {

        if ( this.selected < this._tools.length ) {
            let tool = this._tools[ this.selected ];
            if ( tool.update ) tool.update( data );
        }

    }

    _registerBasicTools() {
    }

}
