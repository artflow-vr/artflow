'use strict';

let THREE = window.THREE;
require( '../../../vendor/BufferGeometryUtils' );

let AbstractTool = require( './abstract-tool' );

let WaterShader = require( '../../shader/water/water-shader' );

let AssetManager = require( '../../utils/asset-manager' );

let uniforms = THREE.UniformsUtils.clone( WaterShader.uniforms );
let plane = null;

function WaterTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        speed: 100
    } );

    uniforms.normalMap.value = AssetManager.assets.texture.water_normal;
    uniforms.normalMap.value.wrapS = THREE.RepeatWrapping;
    uniforms.normalMap.value.wrapT = THREE.RepeatWrapping;

    let geometry = new THREE.PlaneBufferGeometry( 2, 2 );
    THREE.BufferGeometryUtils.computeTangents( geometry );

    let material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: WaterShader.vertex,
        fragmentShader: WaterShader.fragment,
        side: THREE.DoubleSide,
        transparent: true,
        lights: true,
        extensions: {
            derivatives: true
        }
    } );
    plane = new THREE.Mesh( geometry, material );
    plane.translateZ( 5.0 );
    plane.rotateZ( Math.PI / 4 );
    plane.rotateY( Math.PI / 4 );

    this.view.addTHREEObject( plane );

}
WaterTool.prototype = Object.create( AbstractTool.prototype );
WaterTool.prototype.constructor = WaterTool;

WaterTool.prototype.update = function () {
    uniforms.uTime.value += 0.001;
};

WaterTool.prototype.trigger = function () { };

WaterTool.prototype.release = function () { };

module.exports = WaterTool;
