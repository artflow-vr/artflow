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
import AbstractBrushStroke from './abstract-brush-stroke';
import AbstractBrushAnimatedStroke from './brush-strokes/abstract-brush-animated-stroke';

const SIZE_FACTOR = 0.2;

export default class BrushTool extends AbstractTool {

    constructor( isVR, stroke = 'rainbowAnim' ) {

        super();

        this.dynamic = true;

        //AbstractTool.call( this, null );

        this.registeredStrokes = null;

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
            self.setColor( hsv );
        } );

        this.mesh = null;

        this.registeredStrokes = {
            withTex: new AbstractBrushStroke( isVR ),
            withoutTex: new AbstractBrushStroke( isVR, 'material_without_tex' ),
            testAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'test-shader' } ),
            squaresAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'squares-shader', timeMod: 100, timeOffset: 0.5 } ),
            rainbowAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'rainbow-shader', timeModCondition: 3 } ),
            matrixAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'matrix-shader' } ),
            dongAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'dong-shader', thicknessMult: 2.0 } ),
            fractalAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'fractal-shader' } ),
            electricAnim : new AbstractBrushAnimatedStroke( isVR, { shaderPath: 'electric-shader', thicknessMult: 2.0 } )
        };

        this.currentStroke = stroke;

    }

    setCurrentStroke( id ) {

        this.currentStroke = id;

    }

    update( data ) {

        for ( let s in this.registeredStrokes )
            this.registeredStrokes[ s ].update( data );

    }

    use( data ) {

        this.registeredStrokes[ this.currentStroke ].use( data );

    }

    trigger() {

        this.registeredStrokes[ this.currentStroke ].trigger( this );

    }

    useAxisChanged( data ) {

        this.options.brushThickness =
            data.controller.sizeMesh.scale.x * SIZE_FACTOR;
        this._helper.setThickness( this.options.brushThickness );

    }

    setColor( hsv ) {

        this.registeredStrokes[ this.currentStroke ].setColor( hsv );

    }
}
