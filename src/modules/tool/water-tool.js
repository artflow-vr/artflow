import '../../../vendor/BufferGeometryUtils';

import AbstractTool from './abstract-tool';
import WaterShader from '../../shader/water/water-shader';
import {
    AssetManager
} from '../../utils/asset-manager';

let uniforms = THREE.UniformsUtils.clone( WaterShader.uniforms );
let plane = null;

export default class WaterTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.setOptionsIfUndef( {
            speed: 50,
            color: new THREE.Vector3()
        } );

        let geometry = new THREE.PlaneBufferGeometry( 2, 2 );
        THREE.BufferGeometryUtils.computeTangents( geometry );

        let cubemap = AssetManager.assets.cubemap.cubemap;

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
        plane = new THREE.Mesh( geometry, material.clone() );
        plane.material.uniforms.normalMap.value = AssetManager.assets.texture
            .water_normal;
        plane.material.uniforms.normalMap.value.wrapS = THREE.RepeatWrapping;
        plane.material.uniforms.normalMap.value.wrapT = THREE.RepeatWrapping;
        plane.material.uniforms.uSpeed.value = this.options.speed;
        plane.material.uniforms.uCubemap.value = cubemap;

        plane.translateZ( 5.0 );
        plane.rotateZ( -Math.PI / 4 );
        //plane.rotateX( Math.PI / 2.5 );

        let plane2 = new THREE.Mesh( geometry, material.clone() );
        plane2.material.uniforms.normalMap.value = AssetManager.assets.texture
            .water_normal;
        plane2.material.uniforms.normalMap.value.wrapS = THREE.RepeatWrapping;
        plane2.material.uniforms.normalMap.value.wrapT = THREE.RepeatWrapping;
        plane2.material.uniforms.uSpeed.value = this.options.speed;
        plane2.translateZ( 5.0 );
        plane2.translateX( 4.0 );
        plane2.rotateX( Math.PI / 3 );
        plane2.material.uniforms.uCubemap.value = cubemap;

        let plane3 = new THREE.Mesh( geometry, material.clone() );
        plane3.material.uniforms.normalMap.value = AssetManager.assets.texture
            .water_normal;
        plane3.material.uniforms.normalMap.value.wrapS = THREE.RepeatWrapping;
        plane3.material.uniforms.normalMap.value.wrapT = THREE.RepeatWrapping;
        plane3.material.uniforms.uSpeed.value = this.options.speed;
        plane3.translateZ( 5.0 );
        plane3.translateX( 8.0 );
        plane3.material.uniforms.uCubemap.value = cubemap;

        this.worldGroup.addTHREEObject( plane );
        this.worldGroup.addTHREEObject( plane2 );
        this.worldGroup.addTHREEObject( plane3 );

    }

    update() {

        this.worldGroup.object.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh )
                child.material.uniforms.uTime.value += 0.001;

        } );

    }

    trigger() {}

    release() {}

}
