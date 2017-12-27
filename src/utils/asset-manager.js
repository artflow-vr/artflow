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
// MTLLoader is auto-added to the THREE namespace.
import '../../vendor/MTLLoader';


const ROOT_FOLDER = 'assets/';
const MODEL_FOLDER = ROOT_FOLDER + 'model/';
const TEXTURE_FOLDER = ROOT_FOLDER + 'texture/';
const ASSETS = {
    model: {
        tool: MODEL_FOLDER + 'tool/',
        env: MODEL_FOLDER + 'env/'
    },
    texture: {
        cubemap: TEXTURE_FOLDER + 'cubemap/',
        env: TEXTURE_FOLDER + 'env/',
        tool: TEXTURE_FOLDER + 'tool/',
        ui: {
            root: TEXTURE_FOLDER + 'ui/',
            item: TEXTURE_FOLDER + 'ui/item/',
            tool: TEXTURE_FOLDER + 'ui/tool/'
        }
    }
};

const ASSETTYPE = {
    TEXTURE: 0,
    CUBEMAP: 1,
    MODEL: 2
};

let splitOnExt = ( file ) => {

    let charIdx = file.lastIndexOf( '.' );
    if ( charIdx === -1 ) return null;

    let fileName = file.substr( 0, charIdx );

    ++charIdx;
    let ext = file.substr( charIdx, file.length - charIdx );

    return { file: fileName, ext: ext };

};

class Manager {

    constructor() {

        let buildAssetDict = ( base, target ) => {

            for ( let k in base ) {
                if ( k !== 'root' ) target[ k ] = {};
                if ( typeof base[ k ] === 'object' )
                    buildAssetDict( base[ k ], target[ k ] );
            }

        };

        // Build an object with the same structure as loaded assets graph.
        this.assets = {};
        buildAssetDict( ASSETS, this.assets );

        this._type = [
            // Texture loading function
            ( file, ext, path, resolve, reject ) => {

                let fullName = file + '.' + ext;
                if ( path ) this._textureLoader.setPath( path );
                this._textureLoader.load( fullName, resolve, undefined, reject );

            },
            // Cubemap loading function
            ( file, ext, path, resolve, reject ) => {

                let urls = [
                    file + '-px.' + ext, file + '-nx.' + ext,
                    file + '-py.' + ext, file + '-ny.' + ext,
                    file + '-pz.' + ext, file + '-nz.' + ext
                ];

                if ( path ) this._cubeTextureLoader.setPath( path );
                let toLoad = this._cubeTextureLoader.load( urls, resolve,
                    undefined, reject );
                toLoad.format = THREE.RGBFormat;

            },
            // Model loading function
            ( file, ext, path, resolve, reject ) => {

                let fullName = file + '.' + ext;
                let fullPath = path || './';

                let matLoader = new THREE.MTLLoader();
                matLoader.setPath( fullPath );
                matLoader.load( file + '.mtl', ( materials ) => {

                    materials.preload();

                    let loader = new THREE.OBJLoader();
                    loader.setPath( fullPath );
                    loader.setMaterials( materials );
                    loader.load( fullName, resolve, undefined, reject );

                }, undefined, () => {

                    let loader = new THREE.OBJLoader();
                    loader.setPath( fullPath );
                    loader.load( fullName, resolve, undefined, reject );

                } );

            }

        ];

        this._textureLoader = new THREE.TextureLoader();
        this._cubeTextureLoader = new THREE.CubeTextureLoader();

    }

    init() {

        return this._loadRequiredAssets();

    }

    autoload( data ) {

        if ( !data ) {
            let warnMsg = 'no data object has been provided.';
            console.warn( 'AssetManager: autoload(): ' + warnMsg );
            return undefined;
        }

        if ( !data.file || !data.file instanceof String ) {
            let warnMsg = 'given object does not contain a valid `file`.';
            console.warn( 'AssetManager: autoload(): ' + warnMsg );
            return undefined;
        }

        let file = data.file;
        let basePath = data.path || '';

        let splitFile = splitOnExt( file );
        if ( splitFile === null ) {
            let warnMsg = 'asset ' + file + ' can not be autoloaded ';
            warnMsg += 'if its name does not contain an extension.';
            console.warn( 'AssetManager: autoload(): ' + warnMsg );
            return undefined;
        }

        let fileType = null;
        switch ( splitFile.ext ) {
            case 'jpg':
            case 'png':
                fileType = ASSETTYPE.TEXTURE;
                break;
            case 'obj':
                fileType = ASSETTYPE.MODEL;
                break;
            default:
                let warnMsg = 'ext `' + splitFile.ext + '` not supported';
                console.warn( 'AssetManager: autoload(): ' + warnMsg );
        }

        let promise = this.load( {
            file: splitFile.file,
            ext: splitFile.ext,
            type: fileType,
            path: basePath,
            id: data.id,
            container: data.container
        } );
        if ( !data.promises ) return promise;

        // In-place adding to a promises list
        data.promises.push( promise );
        return undefined;
    }

    load( data ) {

        if ( !data ) {
            let warnMsg = 'no data object has been provided.';
            console.warn( 'AssetManager: load(): ' + warnMsg );
            return null;
        }

        if ( data.type === undefined
            || data.type < 0 || data.type >= this._type.length ) {
            let warnMsg = 'type \'' + data.type + '\' is not recognized.';
            throw console.warn( 'AssetManager: load(): ' + warnMsg );
        }

        if ( !data.container || typeof data.container !== 'object' ) {
            let warnMsg = 'no container provided to save the loaded asset.';
            throw console.warn( 'AssetManager: load(): ' + warnMsg );
        }

        let type = data.type;
        let fileName = null;
        let ext = null;
        let id = null;

        // Checks whether we were given an absolute path or not.
        if ( !data.absolute ) {
            if ( !data.file || !data.ext ) {
                let warnMsg = 'no extension or no file name provided.';
                console.warn( 'AssetManager: load(): ' + warnMsg );
                return null;
            }
            fileName = data.file;
            ext = data.ext;
        }

        id = data.id || fileName;
        if ( id in data.container ) {
            let warnMsg = 'asset ' + id + ' had already been registered.';
            console.warn( 'AssetManager: ' + warnMsg );
        }

        return new Promise( ( resolve ) => {

            this._type[ type ]( fileName, ext, data.path, function ( object ) {

                data.container[ id ] = object;
                console.log( object );
                resolve();

            }, function () {

                let warnMsg = 'failed to load \'' + fileName + '\'\n';
                warnMsg += 'Please check the path, filename, and type.';
                console.warn( 'AssetManager: ' + warnMsg );

            } );

        } );

    }

    _loadRequiredAssets() {

        let promises = [];
        // Does not return a promise, because the loading is synchronous.
        this._loadPrimitives();
        this._loadDefaultAssets( promises );
        this._loadDefaultCubemap( promises );

        //this._loadUIAssets( promises );
        return Promise.all( promises );

    }

    _loadDefaultAssets( promises ) {

        let autoload = ( list, path, container ) => {
            for ( let elt of list ) {
                promises.push( this.autoload( {
                    file: elt.file, path: path,
                    promises: promises, id: elt.id, container: container
                } ) );
            }
        };


        // TODO: make an atlases of related textures.

        const envTextures = [
            { file: 'controller-diffuse.png' },
            { file: 'controller-specular.png' },
            { file: 'floor.jpg' }
        ];

        const toolTextures = [
            { file: 'brush3.png', id: 'brush1' },
            { file: 'brush3_N.png', id: 'brush1_N' },
            { file: 'particle_raw.png', id: 'brush1_N' },
            { file: 'perlin-512.png', id: 'particle_noise' },
            { file: 'noise.jpg', id: 'particle_position' },
            { file: 'noise.jpg', id: 'particle_velocity' }, // Why?
            { file: 'noise.jpg', id: 'particle_position_out' }, // Why?
            { file: 'noise.jpg', id: 'particle_velocity_out' }, // Why?
            { file: 'water_normal.png' }
        ];

        const uiTextures = [
            { file: 'background.png', id: 'background' },
            { file: 'button-background.png', id: 'button-back' },
            { file: 'button-hover.png', id: 'button-hover' },
            { file: 'home-icon.png', id: 'home' },
            { file: 'arrow-icon.png', id: 'arrow-left' },
            { file: 'slider-bright.png', id: 'slider' },
            { file: 'slider-button.png' },
            { file: 'color-wheel.png' }
        ];

        const uiToolTextures = [
            { file: 'brush-icon.png' },
            { file: 'particles-icon.png' },
            { file: 'tree-icon.png' },
            { file: 'water-icon.png' }
        ];

        const uiToolItemsTextures = [
            // TREE
            { file: 'tree/bush.png', id: 'tree-bush' },
            { file: 'tree/contextSens.png', id: 'tree-contextSens' },
            { file: 'tree/contextSens.png', id: 'tree-contextSens' },
            { file: 'tree/cube.png', id: 'tree-cube' },
            { file: 'tree/simple.png', id: 'tree-simple' },
            { file: 'tree/tilt.png', id: 'tree-tilt' },
            // BRUSH
            { file: 'brush/unified.png', id: 'brush-unified' },
            { file: 'brush/confettis.png', id: 'brush-confettis' },
            { file: 'brush/snow.png', id: 'brush-snow' },
            { file: 'brush/spiral.png', id: 'brush-spiral' },
            { file: 'brush/rainbow.png', id: 'brush-rainbow' },
            { file: 'brush/square.png', id: 'brush-square' },
            { file: 'brush/wave.png', id: 'brush-wave' },
            { file: 'brush/blue.png', id: 'brush-blue' },
            { file: 'brush/matrix.png', id: 'brush-matrix' },
            { file: 'brush/fractal.png', id: 'brush-fractal' },
            { file: 'brush/lightning.png', id: 'brush-lightning' },
            { file: 'brush/spiral.png', id: 'brush-spiral' },
            { file: 'brush/stars.png', id: 'brush-stars' },
            { file: 'brush/freepik_6.png', id: 'brush-void' },
            { file: 'brush/rasta.png', id: 'brush-trippy-rasta' }
        ];

        const toolModels = [
            { file: 'teleporter.obj' },
            { file: 'water_preview.obj' },
            { file: 'tree_preview.obj' },
            { file: 'particle_preview.obj' }
        ];

        const envModels = [
            { file: 'vive-controller.obj' }
        ];

        autoload( envTextures, ASSETS.texture.env, this.assets.texture.env );
        autoload( toolTextures, ASSETS.texture.tool, this.assets.texture.tool );
        autoload( uiTextures, ASSETS.texture.ui.root, this.assets.texture.ui );
        autoload(
            uiToolTextures,
            ASSETS.texture.ui.tool,
            this.assets.texture.ui.tool
        );
        autoload(
            uiToolItemsTextures,
            ASSETS.texture.ui.item,
            this.assets.texture.ui.item
        );
        autoload( toolModels, ASSETS.model.tool, this.assets.model.tool );
        autoload( envModels, ASSETS.model.env, this.assets.model.env );

    }

    _loadDefaultCubemap( promises ) {

        const toLoad = [
            'nightsky'
        ];

        for ( let elt of toLoad ) {
            promises.push( this.load( {
                file: elt, ext: 'png', type: ASSETTYPE.CUBEMAP,
                container: this.assets.texture.cubemap,
                path: ASSETS.texture.cubemap, id: 'cubemap'
            } ) );
        }

    }

    /**
     *
     * Instanciates basic geometries needed in the whole program.
     * e.g: cube, plane.
     *
     * @param {any} promises
     * @memberof Manager
     */
    _loadPrimitives() {

        this.assets.model.cube = new THREE.BoxGeometry( 1, 1, 1 );

        let line = new THREE.Geometry();
        line.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        line.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

        this.assets.model.line = line;

    }
}

let AssetManager = new Manager();

export {
    AssetManager,
    ASSETTYPE
};
