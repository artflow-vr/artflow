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

'use strict';

import { MainView } from '../../../view/view';
import AbstractBrushStroke from '../abstract-brush-stroke';

export default class AbstractBrushAnimatedStroke extends AbstractBrushStroke {

    constructor( isVR, shaderPath ) {

        super( isVR, 'material_test_shader' );

        this.shader = require( '../../../shader/brushes/' + shaderPath );
        this.uniforms = THREE.UniformsUtils.clone( this.shader.uniforms );

        let material = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: this.shader.vertex,
            fragmentShader: this.shader.fragment,
            side: THREE.DoubleSide,
            transparent: true
        } );

        this._helper._material = material.clone();

        this.timeOffset = 0.01;
        this.timeMod = 0;
        this.timeModCondition = 0;
        this.timeModConditionStart = 1.0;

    }

    update( ) {

        for ( let m in this._helper._meshes ) {
            let m2 = this._helper._meshes[ m ];
            if ( this.timeModCondition && Math.floor( m2.material.uniforms.uTime.value + 1 ) % this.timeModCondition === 0 )
                m2.material.uniforms.uTime.value = this.timeModConditionStart;
            if ( this.timeMod )
                m2.material.uniforms.uTime.value %= this.timeMod;
            m2.material.uniforms.uTime.value += this.timeOffset;
            m2.material.uniforms.vResolution.value = new THREE.Vector2( MainView._dimensions.width, MainView._dimensions.height );
        }
    }

}
