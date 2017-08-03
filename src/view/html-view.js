'use strict';

function HTMLView( dataStyle ) {

    this._container = document.createElement( 'div' );
    this._displayStyleValue = 'block';

    if ( dataStyle ) this.applyDataStyle( dataStyle );
}
module.exports = HTMLView;

HTMLView.prototype.addChild = function ( htmlView ) {

    if ( htmlView === undefined || htmlView === null ) {
        let errorMsg = 'addChild() called with a null/undefined value.';
        throw Error( 'HTMLView: ' + errorMsg );
    }
    if ( !( htmlView instanceof HTMLView ) ) {
        let errorMsg = 'addChild() has been called with a wrong type. ';
        errorMsg += 'Use HTMLView or make your own DOM appendChild().';
        throw Error( 'HTMLView: ' + errorMsg );
    }

    this._container.appendChild( htmlView.getDOMElement() );

};

HTMLView.prototype.setProp = function ( propID, value ) {

    this._container[ propID ] = value;

};

HTMLView.prototype.setStyleProp = function ( propID, value ) {

    if ( propID === 'display' ) this._displayStyleValue = value;
    this._container.style[ propID ] = value;

};

HTMLView.prototype.applyDataStyle = function ( dataStyle ) {

    for ( let k in dataStyle ) {
        if ( k in this._container.style )
            this._container.style[ k ] = dataStyle[ k ];
    }

};

HTMLView.prototype.toggleVisibility = function ( trigger ) {

    if ( trigger )
        this._container.style.display = this._displayStyleValue;
    else
        this._container.style.display = 'none';

};

HTMLView.prototype.getDOMElement = function () {

    return this._container;

};
