'use strict';

let THREE = window.THREE;

function ModelView( object ) {

    this._object = object;

}
module.exports = ModelView;

ModelView.prototype.applyMaterial = function ( material ) {

    this._object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) child.material =
            material;

    } );

};

ModelView.prototype.setVisible = function ( trigger ) {

    this._object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) child.visible = trigger;

    } );

};

ModelView.prototype.getObject = function () {

    return this._object;

};
