'use strict';

let THREE = window.THREE;

// OBJLoader is auto-added to the THREE namespace.
require( '../../vendor/OBJLoader' );

let AssetManager = module.exports;

AssetManager._assetRoot = 'assets/';
AssetManager._modelPath = AssetManager._assetRoot + 'models/';
AssetManager._texturePath = AssetManager._assetRoot + 'textures/';

/**
 * Creates some constants containing ArtFlow mandatory assets.
 * These assets have a particular material assigned at their instanciation
 * to avoid assigning them by hand later.
 */
AssetManager.ARTFLOW_MATERIALS = {};
AssetManager.TELEPORTER = 'teleporter';
AssetManager.VIVE_CONTROLLER = 'vive-controller';

AssetManager.init = function () {

    this._assets = {};
    this._OBJLoader = new THREE.OBJLoader();

    this.ARTFLOW_MATERIALS[ this.TELEPORTER ] = new THREE.MeshLambertMaterial( {
        color: new THREE.Color( 0X27ae60 ),
        emissive: 0X27ae60,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    } );

    return this._loadRequiredAssets();

};

AssetManager.load = function ( assetID, assetPath, fileName ) {

    let self = this;
    return new Promise( function ( resolve, reject ) {

        if ( assetID in self._assets ) {
            let warnMsg = 'asset ' + assetID +
                ' has already been registered';
            console.warn( 'AssetManager: ' + warnMsg );
        }

        self._OBJLoader.setPath( assetPath );
        self._OBJLoader.load( fileName, function ( object ) {

            self._assets[ assetID ] = object;

            // Assigns default material, if the registered asset
            // is part of ArtFlow mandatory asset.
            if ( assetID in self.ARTFLOW_MATERIALS ) {
                object.traverse( function ( child ) {

                    let material = self.ARTFLOW_MATERIALS[
                        assetID ];
                    if ( child instanceof THREE.Mesh )
                        child.material = material;

                } );
            }

            resolve();

        }, undefined, function ( threeError ) {

            let errorMsg = 'AssetManager: ';
            errorMsg += 'impossible to load \'' + assetPath +
                '\'\n';
            errorMsg += 'THREE: ' + threeError;
            reject( errorMsg );

        } );

    } );

};

AssetManager.get = function ( assetID ) {

    return this._assets[ assetID ];

};

AssetManager._loadRequiredAssets = function () {

    let promises = [];

    promises.push(
        this.load( AssetManager.TELEPORTER, this._modelPath,
            'teleporter.obj' )
    );

    promises.push(
        this.load( AssetManager.VIVE_CONTROLLER, this._modelPath,
            'vive-controller.obj' )
    );

    return Promise.all( promises );

};
