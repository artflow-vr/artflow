'use strict';

let THREE = window.THREE;

/**
 * Wrapper on THREE.Group(), containing utils method to apply material, change
 * the visibility of the group, or move its position.
 *
 * @constructor
 */
function THREEView() {

     this._object = new THREE.Group();

}
/**
 * Adds a THREE.JS Object3D to the group contained in this instance.
 *
 * @param  {THREE.Object3D} object object to add to the group.
 */
THREEView.prototype.addTHREEObject = function ( object ) {

    if ( !( object instanceof THREE.Object3D ) ) {
        let errorMsg = 'addTHREEObject() was not given a THREE.JS object.';
        throw Error( 'THREEView: ' + errorMsg );
    }

    this._object.add( object );

};

/**
 * Travers the object in order to apply a given material to every mesh.
 *
 * @param  {THREE.Material} material Material to apply.
 */
THREEView.prototype.applyMaterial = function ( material ) {

    this._object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) child.material = material;

    } );

};
/**
 * Sets the position of the group.
 *
 * @param  {THREE.Vector3} position Target position.
 * It is good to note that the given position is not changed, the three
 * components are copied one by one.
 */
THREEView.prototype.setPos = function ( position ) {

    this._object.position.x = position.x;
    this._object.position.y = position.y;
    this._object.position.z = position.z;

};

/**
 * Sets group to visible or invisible.
 *
 * @param  {boolean} trigger True to display the group. False otherwise.
 */
THREEView.prototype.setVisible = function ( trigger ) {

    this._object.traverse( function ( child ) {

        //if ( child instanceof THREE.Object3D ) child.visible = trigger;

    } );

};

/**
 * Returns the THREE.Group object from the instance.
 */
THREEView.prototype.getObject = function () {

    return this._object;

};

module.exports = THREEView;
