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

const DEFAULT_MAT = new THREE.MeshStandardMaterial( {
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    metalness: 0.0,
    roughness: 0.3
} );

const TEXTURE_MAT = new THREE.MeshPhongMaterial( {
    side: THREE.DoubleSide,
    map: null,
    normalMap: null,
    transparent: true,
    depthTest: false,
    shininess: 40
} );

export default class BrushTool extends AbstractTool {

    constructor( options ) {

        super( options );

        let isVR = options.isVR || false;
        let stroke = options.stroke || 'starsAnim';

        this.dynamic = true;
        this.registeredStrokes = null;

        this.registerEvent( 'interact', {
            use: this.use.bind( this ),
            trigger: this.trigger.bind( this )
        } );

        this.registerEvent( 'axisChanged', {
            use: this.useAxisChanged.bind( this ),
            release: () => {
                this._previousY = 0.0;
            }
        } );

        this.registerEvent( 'colorChanged', ( hsv ) => {
            this.setColor( hsv );
        } );

        this.mesh = null;

        this.registeredStrokes = {};
        for ( let k in BrushTool.items ) {
            let data = BrushTool.items[ k ].data;
            if ( !data.static ) {
                this.registeredStrokes[ k ] = new AbstractBrushAnimatedStroke( isVR, data );
                continue;
            }
            if ( !data.texture ) {
                this.registeredStrokes[ k ] = new AbstractBrushStroke( isVR, DEFAULT_MAT );
                continue;
            }
            let material = TEXTURE_MAT;
            material.map = data.texture;
            material.normalMap = data.normal;
            this.registeredStrokes[ k ] = new AbstractBrushStroke( isVR, material );
        }

        this.currentStroke = stroke;
        this._lastHsv = { h: 0.0, s: 0.0, v: 0.0 };

    }

    onItemChanged( id ) {

        this.currentStroke = id;
        this._updateStrokeData();

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

        let stroke = this.registeredStrokes[ this.currentStroke ];
        stroke._helper.setThickness( this.options.brushThickness );

    }

    setColor( hsv ) {

        this.registeredStrokes[ this.currentStroke ].setColor( hsv );
        Object.assign( this._lastHsv, hsv );

    }

    _updateStrokeData() {

        if ( !this.options.brushThickness ) return;

        let stroke = this.registeredStrokes[ this.currentStroke ];
        stroke._helper.setThickness( this.options.brushThickness );

        stroke.setColor( this._lastHsv );

    }
}
