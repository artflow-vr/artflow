/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 * @author Daosheng Mu / https://github.com/DaoshengMu/
 */

THREE.ImageUtils.generateDataTexture = function ( width, height, color ) {

    let size = width * height;
    let data = new Uint8Array( 4 * size );

    let r = Math.floor( color.r * 255 );
    let g = Math.floor( color.g * 255 );
    let b = Math.floor( color.b * 255 );

    for ( let i = 0; i < size; i ++ ) {
        data[ i * 4 ] 	  = r;
        data[ i * 4 + 1 ] = g;
        data[ i * 4 + 2 ] = b;
        data[ i * 4 + 3 ] = 255;

    }

    let texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat );
    texture.needsUpdate = true;

    return texture;

};
