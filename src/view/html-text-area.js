'use strict';

let HTMLView = require( './html-view' );

function HTMLTextArea( message, dataStyle = null, useArtflowDefault = true ) {

    HTMLView.call( this );

    if ( message !== undefined && message !== null )
        this._container.innerHTML = message;

    if ( useArtflowDefault )
        this._useDefaultValues();

    // Applies the selected style after applying default values.
    // Using HTMLView constructor would override the user given style.
    if ( dataStyle ) this.applyDataStyle( dataStyle );

}
HTMLTextArea.prototype = Object.create( HTMLView.prototype );
module.exports = HTMLTextArea;

HTMLTextArea.prototype.setMessage = function ( message ) {

    if ( message === undefined || message === null ) {
        let errorMsg = 'no message provided or has a null value.';
        throw Error( 'HTMLTextArea: ' + errorMsg );
    }
    this._container.innerHTML = message;

};

HTMLTextArea.prototype._useDefaultValues = function () {

    this._container.style.fontFamily = 'sans-serif';
    this._container.style.fontSize = '16px';
    this._container.style.fontStyle = 'normal';
    this._container.style.lineHeight = '26px';
    this._container.style.backgroundColor = '#fff';
    this._container.style.color = '#000';
    this._container.style.padding = '10px 20px';
    this._container.style.display = 'inline-block';

};
