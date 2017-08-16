'use strict';

let THREE = window.THREE;

/**
 * Wrapper on THREE.Group(), containing utils method to apply material, change
 * the visibility of the group, or move its position.
 *
 * @constructor
 */
function THREEView() {

    this.object = new THREE.Group();

}
/**
 * Adds a THREE.JS Object3D to the group contained in this instance.
 *
 * @param  {THREE.Object3D} obj object to add to the group.
 */
THREEView.prototype.addTHREEObject = function ( obj ) {

    if ( !( obj instanceof THREE.Object3D ) ) {
        let errorMsg = 'addTHREEObject() was not given a THREE.JS object.';
        throw Error( 'THREEView: ' + errorMsg );
    }

    this.object.add( obj );

};

/**
 * Travers the object in order to apply a given material to every mesh.
 *
 * @param  {THREE.Material} material Material to apply.
 */
THREEView.prototype.applyMaterial = function ( material ) {

    this.object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) child.material =
            material;

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

    this.object.position.x = position.x;
    this.object.position.y = position.y;
    this.object.position.z = position.z;

};

/**
 * Sets group to visible or invisible.
 *
 * @param  {boolean} trigger True to display the group. False otherwise.
 */
THREEView.prototype.setVisible = function ( trigger ) {

    this.object.traverse( function ( child ) {

        if ( child instanceof THREE.Object3D ) child.visible =
            trigger;

    } );

};

/**
 * Returns the THREE.Group object from the instance.
 */
THREEView.prototype.getObject = function () {

    return this.object;

};

module.exports = THREEView;
