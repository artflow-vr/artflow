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

import { AssetManager } from '../utils/asset-manager';

import TestShader from '../shader/brushes/test-shader';

let uniforms = THREE.UniformsUtils.clone( TestShader.uniforms );

export default class ObjectPool {

    constructor() {

        this._registeredTemplates = null;
        this._mapRegisteredTemplates = new Map();

        this._allocate();

    }

    _allocate() {

        this._registeredTemplates = [ {
                type: 'material_with_tex',
                object: new THREE.MeshPhongMaterial( {
                    side: THREE.DoubleSide,
                    map: AssetManager.assets.texture.brush1,
                    normalMap: AssetManager.assets.texture.brush1_N,
                    transparent: true,
                    depthTest: false,
                    shininess: 40
                    /*metalness: 0.2,
                    roughness: 0.3*/
                } )
            },
            {
                type: 'material_without_tex',
                object: new THREE.MeshStandardMaterial( {
                    side: THREE.DoubleSide,
                    transparent: true,
                    depthTest: false,
                    metalness: 0.0,
                    roughness: 0.3
                } )
            },
            {
                type: 'material_test_shader',
                object: new THREE.ShaderMaterial( {
                    uniforms: uniforms,
                    vertexShader: TestShader.vertex,
                    fragmentShader: TestShader.fragment,
                    side: THREE.DoubleSide,
                    depthTest: false,
                    transparent: true
                    //lights: true
                } )
            }
        ];

        for ( let k in this._registeredTemplates ) {
            let v = this._registeredTemplates[ k ];

            this._mapRegisteredTemplates[ v.type ] = v.object;
        }
    }

    addObject( type, obj ) {

        this._mapRegisteredTemplates[ type ] = obj;

    }

    getObject( type ) {

        return this._mapRegisteredTemplates[ type ].clone();

    }

}
