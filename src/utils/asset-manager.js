'use strict';

let THREE = window.THREE;

// OBJLoader is auto-added to the THREE namespace.
require( '../../vendor/OBJLoader' );

let AssetManager = module.exports;

AssetManager._assetRoot = 'assets/';
AssetManager._modelPath = AssetManager._assetRoot + 'models/';
AssetManager._texturePath = AssetManager._assetRoot + 'textures/';
AssetManager._cubemapPath = AssetManager._texturePath + 'cubemap/';

AssetManager.TEXTURE = 'texture';
AssetManager.CUBEMAP = 'cubemap';
AssetManager.MODEL = 'model';

AssetManager._type = {
    texture: null,
    cubemap: null,
    model: null
};

AssetManager.init = function () {

    this.assets = {
        texture: {},
        cubemap: {},
        model: {}
    };

    this._OBJLoader = new THREE.OBJLoader();
    this._textureLoader = new THREE.TextureLoader();
    this._cubeTextureLoader = new THREE.CubeTextureLoader();

    return this._loadRequiredAssets();

};

AssetManager.load = function ( file, ext, type, path, assetID ) {

    if ( !( type in this._type ) ) {
        let errorMsg = 'type \'' + type + '\' is not recognized.';
        throw Error( 'AssetManager: ' + errorMsg );
    }

    let self = this;
    let id = ( assetID === undefined || assetID === null ) ? file : assetID;

    if ( id in this.assets[ type ] ) {
        let warnMsg = 'asset ' + id + ' had already been registered.';
        console.warn( 'AssetManager: ' + warnMsg );
    }

    return new Promise( function ( resolve ) {

        let fixedPath = ( path === undefined ) ? '.' : path;

        self._type[ type ]( file, ext, fixedPath, function ( object ) {

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

};

AssetManager._loadTexture = function ( file, ext, path, resolve, reject ) {

    this._textureLoader.setPath( path );
    this._textureLoader.load( file + ext, resolve, undefined, reject );

};
AssetManager._type.texture = AssetManager._loadTexture.bind( AssetManager );

AssetManager._loadModel = function ( file, ext, path, resolve, reject ) {

    this._OBJLoader.setPath( path );
    this._OBJLoader.load( file + ext, resolve, undefined, reject );

};
AssetManager._type.model = AssetManager._loadModel.bind( AssetManager );

AssetManager._loadCubemap = function ( file, ext, path, resolve, reject ) {

    let urls = [
        file + '-px' + ext, file + '-nx' + ext,
        file + '-py' + ext, file + '-ny' + ext,
        file + '-pz' + ext, file + '-nz' + ext
    ];

    this._cubeTextureLoader.setPath( path );
    let toLoad = this._cubeTextureLoader.load( urls, resolve,
        undefined, reject );
    toLoad.format = THREE.RGBFormat;

};
AssetManager._type.cubemap = AssetManager._loadCubemap.bind( AssetManager );

AssetManager._loadRequiredAssets = function () {

    let promises = [];

    promises.push(
        this.load( 'teleporter', '.obj',
            AssetManager.MODEL, this._modelPath )
    );
    promises.push(
        this.load( 'vive-controller', '.obj',
            AssetManager.MODEL, this._modelPath )
    );
    promises.push(
        this.load( 'nightsky', '.png',
            AssetManager.CUBEMAP, this._cubemapPath, 'cubemap' )
    );
    promises.push(
        this.load( 'brush2', '.png',
            AssetManager.TEXTURE, this._texturePath, 'brush1' )
    );

    return Promise.all( promises );

};
