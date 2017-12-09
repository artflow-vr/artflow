/**
* ArtFlow application
* https://github.com/artflow-vr/artflow
*
* MIT License
*
* Copyright (c) 2017 artflow
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import '../../../vendor/BufferGeometryUtils';

import AbstractTool from './abstract-tool';
import WaterShader from '../../shader/water/water-shader';
import { AssetManager } from '../../utils/asset-manager';

const MARKER_SCALE = 0.2;
const MARKER_SCALE_VR = 0.05;

const MARKER_MATERIAL = new THREE.MeshStandardMaterial( {
    color: 0X3498db,
    wireframe: false,
    metalness: 0.5,
    roughness: 0.5
} );

const LINE_COLORS = [
    new THREE.Color( 0xe74c3c ),
    new THREE.Color( 0x34495e )
];
const LINE_MATERIAL = new THREE.LineBasicMaterial( {
    color: LINE_COLORS[ 0 ],
    opacity: 1.0,
    linewidth: 3
} );

// This is a temporary structure holding rotation
// to apply to each line linking two marker.
const LINE_QUAT = new THREE.Quaternion();

let uniforms = THREE.UniformsUtils.clone( WaterShader.uniforms );
let plane = null;

export default class WaterTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.dynamic = true;

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
        plane3.translateZ( 2.0 );
        plane3.translateX( 2.0 );
        plane3.material.uniforms.uCubemap.value = cubemap;

        /*this.localGroup.addTHREEObject( plane );
        this.localGroup.addTHREEObject( plane2 );
        this.localGroup.addTHREEObject( plane3 );*/
        /*this.worldGroup.addTHREEObject( plane );
        this.worldGroup.addTHREEObject( plane2 );
        this.worldGroup.addTHREEObject( plane3 );*/

        // Contains the spline drawn by the user. Whenever the drawing is ready,
        // this will be deleted.
        this._markerGroup = new THREE.Group();
        this.worldGroup.addTHREEObject( this._markerGroup );

        // Contains a reference to the previous marked added. This is used
        // to link them with a visual line.
        this._prevMarker = null;

        // Used to animated the marks through time.
        this._lineColorID = 1;
        this._lineAnimTime = 0.0;

        this.registerEvent( 'interact', {
            trigger: this.trigger.bind( this )
        } );

    }

    update( data ) {

        this._markerGroup.traverse( ( child ) => {

            if ( child.name !== 'line' ) return;

            child.material.color.lerp(
                LINE_COLORS[ this._lineColorID ], this._lineAnimTime
            );
            child.material.needsUpdate = true;

        } );

        /*this.worldGroup.object.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh )
                child.material.uniforms.uTime.value += 0.001;

        } );*/

        this._lineAnimTime += data.delta * 0.65;
        if ( this._lineAnimTime >= 1.0 ) {
            this._lineColorID = ( this._lineColorID + 1 ) % LINE_COLORS.length;
            this._lineAnimTime = 0.0;
        }

    }

    trigger( data ) {

        // Adds a new marker to the group.
        let mesh = new THREE.Mesh( AssetManager.assets.model.cube, MARKER_MATERIAL );
        mesh.scale.set( MARKER_SCALE, MARKER_SCALE, MARKER_SCALE );
        mesh.position.set(
            data.position.world.x, data.position.world.y, data.position.world.z
        );
        this._markerGroup.add( mesh );

        // If it is not the first marker, we link the new one
        // with the previous one.
        if ( this._prevMarker ) {
            let vec = this._prevMarker.position.clone();
            let toVec = vec.sub( mesh.position ).normalize();

            LINE_QUAT.setFromUnitVectors(
                new THREE.Vector3( 0.0, 0.0, 1.0 ), toVec
            );

            let line = new THREE.Line(
                AssetManager.assets.model.line , LINE_MATERIAL
            );
            line.name = 'line';
            line.position.copy( this._prevMarker.position );
            line.scale.z = mesh.position.distanceTo( this._prevMarker.position );
            line.quaternion.multiply( LINE_QUAT );

            this._markerGroup.add( line );
        }

        this._prevMarker = mesh;

    }

    release() {}

}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// REGISTERED SUBTOOLS /////////////////////////////

WaterTool.items = {

    plane: {
        uiTexture: ''
    }

};
