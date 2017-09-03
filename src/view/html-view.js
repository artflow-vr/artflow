/**
 * Encapsulates an HTML div, allowing to perform simple operations,
 * such as adding html/css properties, adding child to hierarchy, etc...
 *
 * @constructor
 *
 * @param  {Object} dataStyle css inital style. Be careful, the name of the keys
 * have to match name of css properties, e.g 'position' or 'backgroundColor'.
 */
function HTMLView( dataStyle ) {

    this._container = document.createElement( 'div' );
    this._displayStyleValue = 'block';

    if ( dataStyle ) this.applyDataStyle( dataStyle );
}

/**
 * Adds another HTMLView as a child.
 * @param  {HTMLView} htmlView
 */
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

/**
 * Sets given property of the DOMElement.
 * You can for instance add property 'onclick' with a callback.
 *
 * @param  {string} propID Key name of the property of the HTML element.
 * @param  {string} value Value to assign to the property
 */
HTMLView.prototype.setProp = function ( propID, value ) {

    this._container[ propID ] = value;

};

/**
 * Sets given style property of the DOMElement.
 *
 * @param  {string} propID Key name of the css property.
 * @param  {string} value Value to assign to the property.
 */
HTMLView.prototype.setStyleProp = function ( propID, value ) {

    if ( propID === 'display' ) this._displayStyleValue = value;
    this._container.style[ propID ] = value;

};

/**
 * Applies a given style to the DOMElement.
 *
 * @param  {Object} dataStyle css style to apply to the DOMElement.
 * Be careful, the name of the keys have to match name of css properties,
 * e.g 'position' or 'backgroundColor'.
 */
HTMLView.prototype.applyDataStyle = function ( dataStyle ) {

    for ( let k in dataStyle ) {
        if ( k in this._container.style )
            this._container.style[ k ] = dataStyle[ k ];
    }

};

/**
 * Hides / Shows DOMElement.
 *
 * @param  {boolean} trigger True to display the element, false otherwise.
 * This method changes visibility using the 'display' css property with
 * 'none' to hide the element.
 */
HTMLView.prototype.toggleVisibility = function ( trigger ) {

    if ( trigger )
        this._container.style.display = this._displayStyleValue;
    else
        this._container.style.display = 'none';

};

/**
 * Returns the DOMElement (div) contained in this wrapper.
 */
HTMLView.prototype.getDOMElement = function () {

    return this._container;

};

module.exports = HTMLView;
