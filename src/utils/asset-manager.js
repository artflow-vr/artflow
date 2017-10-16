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

// OBJLoader is auto-added to the THREE namespace.
import '../../vendor/OBJLoader';

let TEXTURE = 'texture';
let CUBEMAP = 'cubemap';
let MODEL = 'model';

class Manager {

    constructor() {

        this._assetRoot = 'assets/';
        this._modelPath = this._assetRoot + 'models/';
        this._texturePath = this._assetRoot + 'textures/';
        this._cubemapPath = this._texturePath + 'cubemap/';

        this.assets = {
            texture: {
                ui: { }
            },
            cubemap: {},
            model: {}
        };

        this._type = {
            texture: this._loadTexture.bind( this ),
            cubemap: this._loadCubemap.bind( this ),
            model: this._loadModel.bind( this )
        };

        this._OBJLoader = new THREE.OBJLoader();
        this._textureLoader = new THREE.TextureLoader();
        this._cubeTextureLoader = new THREE.CubeTextureLoader();

    }

    init() {

        return this._loadRequiredAssets();

    }

    load( file, ext, type, path, assetID ) {

        if ( !( type in this._type ) ) {
            let errorMsg = 'type \'' + type + '\' is not recognized.';
            throw Error( 'AssetManager: ' + errorMsg );
        }

        let self = this;
        let id = ( assetID === undefined || assetID === null ) ? file :
            assetID;

        if ( id in this.assets[ type ] ) {
            let warnMsg = 'asset ' + id + ' had already been registered.';
            console.warn( 'AssetManager: ' + warnMsg );
        }

        return new Promise( function ( resolve ) {

            let fixedPath = ( path === undefined ) ? '.' : path;

            self._type[ type ]( file, ext, fixedPath, function (
                object ) {

                self.assets[ type ][ id ] = object;
                resolve();

            }, function () {

                let warnMsg = 'failed to load \'' + file +
                    '\'\n';
                warnMsg +=
                    'Please check the path, filename, and provided type.';
                console.warn( 'AssetManager: ' + warnMsg );

            } );

        } );

    }

    _loadTexture( file, ext, path, resolve, reject ) {

        this._textureLoader.setPath( path );
        this._textureLoader.load( file + ext, resolve, undefined, reject );

    }

    _loadModel( file, ext, path, resolve, reject ) {

        this._OBJLoader.setPath( path );
        this._OBJLoader.load( file + ext, resolve, undefined, reject );

    }

    _loadCubemap( file, ext, path, resolve, reject ) {

        let urls = [
            file + '-px' + ext, file + '-nx' + ext,
            file + '-py' + ext, file + '-ny' + ext,
            file + '-pz' + ext, file + '-nz' + ext
        ];

        this._cubeTextureLoader.setPath( path );
        let toLoad = this._cubeTextureLoader.load( urls, resolve,
            undefined, reject );
        toLoad.format = THREE.RGBFormat;

    }

    _loadRequiredAssets() {

        let promises = [];

        promises.push(
            this.load( 'teleporter', '.obj', MODEL, this._modelPath )
        );
        promises.push(
            this.load( 'vive-controller', '.obj', MODEL, this._modelPath )
        );
        promises.push(
            this.load( 'controller-diffuse', '.png', TEXTURE, this._texturePath )
        );
        promises.push(
            this.load( 'controller-specular', '.png', TEXTURE, this._texturePath )
        );
        promises.push(
            this.load( 'nightsky', '.png',
                CUBEMAP, this._cubemapPath, 'cubemap' )
        );
        promises.push(
            this.load( 'floor', '.jpg', TEXTURE, this._texturePath )
        );
        promises.push(
            this.load( 'brush3', '.png', TEXTURE, this._texturePath,
                'brush1' )
        );
        promises.push(
            this.load( 'brush3_N', '.png',
                TEXTURE, this._texturePath, 'brush1_N' )
        );
        promises.push(
            this.load( 'particle_raw', '.png',
                TEXTURE, this._texturePath, 'particle_raw' )
        );
        promises.push(
            this.load( 'perlin-512', '.png',
                TEXTURE, this._texturePath, 'particle_noise' )
        );
        promises.push(
            this.load( 'water_normal', '.png', TEXTURE, this._texturePath )
        );
        promises.push(
            this.load( 'noise', '.jpg', TEXTURE, this._texturePath,
                'particle_position_in' )
        );
        promises.push(
            this.load( 'noise', '.jpg', TEXTURE, this._texturePath,
                'particle_velocity_in' )
        );
        promises.push(
            this.load( 'noise', '.jpg', TEXTURE, this._texturePath,
                'particle_position_out' )
        );
        promises.push(
            this.load( 'noise', '.jpg', TEXTURE, this._texturePath,
                'particle_velocity_out' )
        );

        /*
            Loads UI assets
        */
        promises.push(
            this.load( 'ui/background', '.png', TEXTURE, this._texturePath,
                'ui-background' )
        );
        promises.push(
            this.load( 'ui/button-background', '.png', TEXTURE, this._texturePath,
                'ui-button-back' )
        );
        promises.push(
            this.load( 'ui/arrow-icon', '.png', TEXTURE, this._texturePath,
                'ui-arrow-left' )
        );

        /*
            Loads UI tool textures
        */
        for ( let elt of ['brush', 'particles', 'water', 'tree'] ) {
            promises.push(
                this.load( 'ui/tools/' + elt + '-icon', '.png',
                    TEXTURE, this._texturePath, 'ui-tool-' + elt )
            );
        }

        return Promise.all( promises );

    }

}

let AssetManager = new Manager();

export {
    AssetManager,
    TEXTURE,
    CUBEMAP,
    MODEL
};
