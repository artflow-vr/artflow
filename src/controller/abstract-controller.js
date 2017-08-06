'use strict';

let ThreeView = require( '../view/three-view' );

/**
 * Controller interface, with a single ThreeView.
 *
 * @constructor
 *
 */
function AbstractController() {

    this._view = new ThreeView();
    this._view.setVisible( false );
    this.enabled = false;

}

/**
 * Returns the ThreeView contained in this instance.
 */
AbstractController.prototype.getView = function () {

    return this._view;

};

module.exports = AbstractController;
