'use strict';

export default class AddCommand {

    constructor( container, functions ) {

        // Container in which the element has been added.
        this._container = container;
        // Last poped element.
        this.object = null;

        // Developer can give several functions
        // applied in post-order.
        if ( functions ) {
            this._clearFunc = functions.clear || AddCommand.CLEAR_MESH;
            this._undoFunc = functions.undo;
            this._redoFunc = functions.redo;
        } else {
            this._clearFunc = AddCommand.CLEAR_MESH;
        }
    }

    undo() {

        if ( this._container.constructor === Array )
            this.object = this._container.pop();
        else if ( this._container.constructor === THREE.Group )
            this.object = this._container.children.pop();
        else
            console.warn( 'ArtFlow: undo(): called on unsupported container.' );

        if ( this._undoFunc ) this._undoFunc( this.object );

    }

    redo() {

        if ( this._container.constructor === Array )
            this._container.push( this.object );
        else if ( this._container.constructor === THREE.Group )
            this._container.children.push( this.object );
        else
            console.warn( 'ArtFlow: redo(): called on unsupported container.' );

        if ( this._redoFunc ) this._redoFunc( this.object );

        this.object = null;

    }

    clear() {

        if ( this.object === null ) return;

        this._clearFunc( this.object );

    }

}

AddCommand.CLEAR_MESH = ( obj ) => {

    obj.geometry.dispose();
    obj.material.dispose();

};
