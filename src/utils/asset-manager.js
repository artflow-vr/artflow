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
            texture: {},
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
            this.load( 'water_normal', '.png', TEXTURE, this._texturePath )
        );

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
