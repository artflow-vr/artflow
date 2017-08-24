'use strict';

let THREE = window.THREE;

function ObjectPool() {

    this._registeredTemplates = null;
    this.mapRegisteredTemplates = new Map();
    this._allocate();

}

ObjectPool.prototype._allocate = function () {

    this.registeredTemplates = [
        {
            type: 'material',
            object: new THREE.MeshStandardMaterial( {
                side: THREE.DoubleSide,
                //map: tex,
                //color: this.options.color,
                transparent: true,
                depthTest: false,
                metalness: 0.0,
                roughness: 0.9
            } )
        },
        {
            type: 'test',
            object: 'test'
        }
    ];

    for ( let k in this.registeredTemplates ) {
        let v = this.registeredTemplates[ k ];

        this.mapRegisteredTemplates[ v.type ] = v.object;
    }
};

ObjectPool.prototype.getObject = function ( type ) {

    return this.mapRegisteredTemplates[ type ];

};

module.exports = ObjectPool;
