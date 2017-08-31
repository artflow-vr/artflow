'use strict';

let THREE = window.THREE;

let AssetManager = require( './asset-manager' );

function ObjectPool() {

    this._registeredTemplates = null;
    this._mapRegisteredTemplates = new Map();

    this._allocate();

}

ObjectPool.prototype._allocate = function () {

    this._registeredTemplates = [
        {
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
        }
    ];

    for ( let k in this._registeredTemplates ) {
        let v = this._registeredTemplates[ k ];

        this._mapRegisteredTemplates[ v.type ] = v.object;
    }
};

ObjectPool.prototype.addObject = function ( type, obj ) {

    this._mapRegisteredTemplates[ type ] = obj;

};

ObjectPool.prototype.getObject = function ( type ) {

    return this._mapRegisteredTemplates[ type ].clone();

};

module.exports = ObjectPool;
