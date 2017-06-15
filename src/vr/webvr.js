/**
 * Based on @mrdoob and @Mugen87 file: https://github.com/mrdoob/three.js/blob/dev/examples/js/vr/WebVR.js
 * Based on @tojiro's vr-samples-utils.js
 */

'use strict';

let WebVR = {};

WebVR.checkAvailability = function () {

    return new Promise( function ( resolve, reject ) {

        if ( navigator.getVRDisplays === undefined ) {
            reject(
                'Your browser does not support WebVR. See <a href="https://webvr.info">webvr.info</a> for assistance.'
            );
            return;
        }

        navigator.getVRDisplays().then( function ( displays ) {

            if ( displays.length === 0 ) {
                reject(
                    'WebVR supported, but no VRDisplays found.'
                );
            } else {
                resolve();
            }

        } );

    } );

};

WebVR.getVRDisplay = function ( onDisplay ) {

    if ( 'getVRDisplays' in navigator ) {

        navigator.getVRDisplays()
            .then( function ( displays ) {
                onDisplay( displays[ 0 ] );
            } );
    }

};

WebVR.getMessageContainer = function ( message ) {

    let container = document.createElement( 'div' );
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.right = '0';
    container.style.zIndex = '999';
    container.align = 'center';

    let error = document.createElement( 'div' );
    error.style.fontFamily = 'sans-serif';
    error.style.fontSize = '16px';
    error.style.fontStyle = 'normal';
    error.style.lineHeight = '26px';
    error.style.backgroundColor = '#fff';
    error.style.color = '#000';
    error.style.padding = '10px 20px';
    error.style.margin = '50px';
    error.style.display = 'inline-block';
    error.innerHTML = message;

    container.appendChild( error );

    return container;

};

module.exports = WebVR;
