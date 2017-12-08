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

import AbstractBrushStroke from '../abstract-brush-stroke';
import TestShader from '../../../shader/brushes/test-shader';

let uniforms = THREE.UniformsUtils.clone( TestShader.uniforms );


export default class StrokeAnimatedTest extends AbstractBrushStroke {

    constructor( isVR ) {

        super( isVR, 'material_test_shader' );

        let material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: TestShader.vertex,
            fragmentShader: TestShader.fragment,
            side: THREE.DoubleSide,
            transparent: true,
        } );

        this._helper._material = material.clone();

    }

    update( data ) {

        for (let m in this._helper._meshes) {
            let m2 = this._helper._meshes[ m ];
            m2.material.uniforms.uTime.value %= 100;
            m2.material.uniforms.uTime.value += 0.1;
        }

    }

    use( data ) {

        this._helper.addPoint( data.position.world, data.orientation, data.pressure );

        this._helper._material.uniforms.uTime.value += 1.001;

    }
}
