'use strict';

function AddCommand( view ) {

    this._view = view;
    this._redomesh = null;
}

AddCommand.prototype.undo = function () {

    let objects = this._view.object.children;
    this._redomesh = objects.pop();

};

AddCommand.prototype.redo = function () {

    let objects = this._view.object.children;
    objects.push( this._redomesh );

    this._redomesh = null;

};

AddCommand.prototype.clear = function () {

    if ( this._redomesh === null ) return;

    this._redomesh.geometry.dispose();
    this._redomesh.material.dispose();

};

module.exports = AddCommand;
