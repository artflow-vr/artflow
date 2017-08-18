'use strict';

let THREE = window.THREE;

let AbstractTool = require( './abstract-tool' );

let WaterShader = require( '../../shader/water/water-shader' );

let AssetManager = require( '../../utils/asset-manager' );

let uniforms = THREE.UniformsUtils.clone( WaterShader.uniforms );

function WaterTool( options ) {

    AbstractTool.call( this, options );
    this.setOptionsIfUndef( {
        speed: 100
    } );

    uniforms.normalMap.value = AssetManager.assets.texture.water_normal;
    uniforms.normalMap.value.wrapS = THREE.RepeatWrapping;
    uniforms.normalMap.value.wrapT = THREE.RepeatWrapping;

    let geometry = new THREE.PlaneGeometry( 2, 2 );
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
    let plane = new THREE.Mesh( geometry, material );
    this.view.addTHREEObject( plane );
    // END DEBUG

}
WaterTool.prototype = Object.create( AbstractTool.prototype );
WaterTool.prototype.constructor = WaterTool;

WaterTool.prototype.update = function () {
    uniforms.uTime.value += 1 / 60;
};

WaterTool.prototype.trigger = function () { };

WaterTool.prototype.release = function () { };

module.exports = WaterTool;
