/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 * @author Daosheng Mu / https://github.com/DaoshengMu/
 */

THREE.ImageUtils.generateDataTexture = function ( width, height, color ) {

    let size = width * height;
    //let data = new Float32Array( 4 * size );
    let data = new Float32Array( 4 * size );

    let r = color.r;
    let g = color.g;
    let b = color.b;

    for ( let i = 0; i < size; i ++ ) {
        data[ i * 4 ] 	  = r;
        data[ i * 4 + 1 ] = g;
        data[ i * 4 + 2 ] = b;
        data[ i * 4 + 3 ] = 1.0;

    }

    //let texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    let texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    texture.needsUpdate = true;

    return texture;

};

THREE.ImageUtils.generateRandomDataTexture = function ( width, height ) {

    let size = width * height;
    //let data = new Float32Array( 4 * size );
    let data = new Float32Array( 4 * size );

    for ( let i = 0; i < size; i ++ ) {
        data[ i * 4 ] 	  = Math.random();
        data[ i * 4 + 1 ] = Math.random();
        data[ i * 4 + 2 ] = Math.random();
        data[ i * 4 + 3 ] = Math.random();

    }

    //let texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    let texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    texture.needsUpdate = true;

    return texture;

};
