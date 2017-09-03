/**
 * Based on @mrdoob and @Mugen87 file: https://github.com/mrdoob/three.js/blob/dev/examples/js/vr/WebVR.js
 * Based on @tojiro's vr-samples-utils.js
 */

import THREE from 'three';

class WebVR {

    checkAvailability() {

        return new Promise( function ( resolve, reject ) {

            if ( navigator.getVRDisplays === undefined ) {
                let errorMsg =
                    'Your browser does not support WebVR. ';
                errorMsg +=
                    'See <a href="https://webvr.info">webvr.info</a> ';
                errorMsg += 'for assistance.';
                reject( errorMsg );
                return;
            }

            navigator.getVRDisplays().then( function ( displays ) {

                if ( displays.length === 0 )
                    reject(
                        'WebVR supported, but no VRDisplays found.'
                    );
                else
                    resolve();

            } );

        } );

    }

    getVRDisplay( onDisplay ) {

        if ( 'getVRDisplays' in navigator ) {

            navigator.getVRDisplays().then( function ( displays ) {
                onDisplay( displays[ 0 ] );
            } );
        }

    }

    getMessageContainer( message ) {

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

    }

    getButton( display, canvas ) {

        if ( 'VREffect' in THREE && display instanceof THREE.VREffect ) {

            console.error( 'WebVR.getButton() now expects a VRDisplay.' );
            return document.createElement( 'button' );

        }

        let button = document.createElement( 'button' );
        button.style.position = 'absolute';
        button.style.left = 'calc(50% - 50px)';
        button.style.bottom = '20px';
        button.style.width = '100px';
        button.style.border = '0';
        button.style.padding = '8px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#000';
        button.style.color = '#fff';
        button.style.fontFamily = 'sans-serif';
        button.style.fontSize = '13px';
        button.style.fontStyle = 'normal';
        button.style.textAlign = 'center';
        button.style.zIndex = '999';

        if ( display ) {

            button.textContent = 'ENTER VR';
            button.onclick = function () {

                display.isPresenting ? display.exitPresent() :
                    display.requestPresent(
                        [ {
                            source: canvas
                        } ]
                    );

            };

            window.addEventListener( 'vrdisplaypresentchange', function () {

                button.textContent = display.isPresenting ?
                    'EXIT VR' :
                    'ENTER VR';

            }, false );

        } else {

            button.textContent = 'NO VR DISPLAY';

        }

        return button;

    }

}

export default new WebVR();
