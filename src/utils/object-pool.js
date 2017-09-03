import {
    AssetManager
} from '../utils/asset-manager';

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
