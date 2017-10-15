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

import AbstractTool from './abstract-tool';
import StrokeWithTex from './brush-strokes/stroke-with-tex';
import StrokeWithoutTex from './brush-strokes/stroke-without-tex';

export default class BrushTool extends AbstractTool {

    constructor() {

        super();

        //AbstractTool.call( this, null );

        this.registeredStrokes = null;

        let self = this;
        this.registerEvent( 'interact', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self )
        } );

        this.registerEvent( 'axisChanged', {
            use: self.useAxisChanged.bind( self )
        } );

        this.registeredStrokes = {
            'with_tex': new StrokeWithTex(),
            'without_tex': new StrokeWithoutTex()
        };

        this.currentStroke = 'with_tex';

    }

    setCurrentStroke( id ) {

    }

    update() {

    for ( let s in this.registeredStrokes )
        this.registeredStrokes[ s ].update();

    }

    use( data ) {

        this.registeredStrokes[ this.currentStroke ].use( data );

    }

    trigger() {

        this.registeredStrokes[ this.currentStroke ].trigger( this );

    }

    useAxisChanged( data ) {

        this._helper.setLastSizePoint( data );

    }
}
