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
import AddCommand from './command/add-command';
import BrushHelper from './helper/brush-helper';

const SIZE_FACTOR = 0.2;

export default class BrushTool extends AbstractTool {

    constructor( options ) {

        super( options );

    this.registeredStrokes = {
        with_tex : new StrokeWithTex(),
        without_tex : new StrokeWithoutTex()
    };

        this.setOptionsIfUndef( BrushTool.registeredBrushes[ 0 ] );

        this._helper = new BrushHelper( this.options );

        let self = this;
        this.registerEvent( 'interact', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self )
        } );

        this.registerEvent( 'axisChanged', {
            use: self.useAxisChanged.bind( self ),
            release: function() {
                self._previousY = 0.0;
            }
        } );

        this.registerEvent( 'colorChanged', ( hsv ) => {
            this._helper.setColor( hsv );
        } );

        this.mesh = null;

    }

    use( data ) {

        this._helper.addPoint(
            data.position.world, data.orientation, data.pressure
        );

    }

    trigger() {

        this.mesh = this._helper.createMesh();
        this.worldGroup.addTHREEObject( this.mesh );

        return new AddCommand( this.worldGroup, this.mesh );

    }

    useAxisChanged( data ) {

        this.options.brushThickness =
            data.controller.sizeMesh.scale.x * SIZE_FACTOR;
        this._helper.setThickness( this.options.brushThickness );

    }

}

module.exports = BrushTool;
