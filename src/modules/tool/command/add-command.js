'use strict';

export default class AddCommand {

    constructor( view ) {

        this._view = view;
        this._redomesh = null;
    }

    undo() {

        let objects = this._view.object.children;
        this._redomesh = objects.pop();

    }

    redo() {

        let objects = this._view.object.children;
        objects.push( this._redomesh );

        this._redomesh = null;

    }

    clear() {

        if ( this._redomesh === null ) return;

        this._redomesh.geometry.dispose();
        this._redomesh.material.dispose();

    }

}
