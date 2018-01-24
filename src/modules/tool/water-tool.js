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

import AbstractTool from './abstract-tool';
import WaterShader from '../../shader/water/water-shader';
import { AssetManager } from '../../utils/asset-manager';

import buildPath from 'utils/path-draw';

const TRIGGER_TIME = 4.0;

const WIREFRAME_SCALE = 0.2;
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

const UNIFORMS = THREE.UniformsUtils.clone( WaterShader.uniforms );
const WATER_MATERIAL = new THREE.ShaderMaterial( {
    uniforms: UNIFORMS,
    vertexShader: WaterShader.vertex,
    fragmentShader: WaterShader.fragment,
    side: THREE.DoubleSide,
    transparent: true,
    lights: true,
    extensions: {
        derivatives: true
    }
} );

export default class WaterTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.dynamic = true;

        this.setOptionsIfUndef( {
            speed: 0.85,
            color: new THREE.Vector3()
        } );

        let cubeGeom = AssetManager.assets.model.cube;
        this._wireframe = new THREE.Mesh( cubeGeom, MARKER_MATERIAL.clone() );
        this._wireframe.scale.set( WIREFRAME_SCALE * 2.0, WIREFRAME_SCALE * 0.4, WIREFRAME_SCALE * 0.4 );
        this._wireframe.material.wireframe = true;
        this._wireframe.material.needsUpdate = true;
        this._wireframe.visible = false;

        // Contains the spline drawn by the user. Whenever the drawing is ready,
        // this will be deleted.
        this._markerGroup = new THREE.Group();
        this._splineGroup = new THREE.Group();
        this._waterGroup = new THREE.Group();

        this.worldGroup.addTHREEObject( this._markerGroup );
        this.worldGroup.addTHREEObject( this._splineGroup );
        this.worldGroup.addTHREEObject( this._waterGroup );

        this.localGroup.addTHREEObject( this._wireframe );

        // This boolean will be set to `true' if
        // the tool is currently selected by the user.
        // We track this using onEnter and onExit.
        this._selected = false;

        // Contains a reference to the previous marked added. This is used
        // to link them with a visual line.
        this._prevMarker = null;

        // Used to animated the marks through time.
        this._lineColorID = 1;
        this._lineAnimTime = 0.0;

        // This variables accumulates time the user spent on the trigger.
        // It will be used to validate the drawing.
        this._triggerTime = 0.0;
        this._triggering = false;

        this.registerEvent( 'interact', {

            release: this.release.bind( this ),
            trigger: this.trigger.bind( this )

        } );

        this.registerEvent( 'axisChanged', {

            use: this.useAxisChanged.bind( this )

        } );

        this._points = [];

    }

    update( data, controllerID ) {

        if ( this._selected ) {
            // Animates the placeholder according to controller.
            let localPos = data.controllers[ controllerID ].position.local;
            let rot = data.controllers[ controllerID ].orientation;
            this._wireframe.position.set( localPos.x, localPos.y, localPos.z );
            this._wireframe.quaternion.copy( rot );

            // Updates time the user spent triggering the button.
            if ( this._triggering ) {
                this._triggerTime += data.delta;
                if ( this._triggerTime >= TRIGGER_TIME ) {
                    this._createPath();
                    this._triggerTime = 0.0;
                    this._triggering = false;
                    this._points.length = 0;
                    this._prevMarker = null;
                }
            }
        }

        // Updates spline color through time.
        this._splineGroup.traverse( ( child ) => {

            if ( child.constructor !== THREE.Line ) return;

            child.material.color.lerp(
                LINE_COLORS[ this._lineColorID ], this._lineAnimTime
            );
            child.material.needsUpdate = true;

        } );

        this._lineAnimTime += data.delta * 0.65;
        if ( this._lineAnimTime >= 1.0 ) {
            this._lineColorID = ( this._lineColorID + 1 ) % LINE_COLORS.length;
            this._lineAnimTime = 0.0;
        }

        // Updates time unfirom used to move the water texture.
        this._waterGroup.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh ) {
                let uniform = child.material.uniforms.uTime;
                uniform.value = ( uniform.value + data.delta );
            }

        } );

    }

    trigger() {

        this._triggering = true;

    }

    release( data ) {

        if ( !this._triggering ) return;

        this._points.push( {
            orientation: data.orientation.clone(),
            coords: data.position.world.clone()
        } );

        // Adds a new marker to the group.
        let mesh = new THREE.Mesh( AssetManager.assets.model.cube, MARKER_MATERIAL );
        mesh.scale.set( MARKER_SCALE_VR, MARKER_SCALE_VR, MARKER_SCALE_VR );
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

            this._splineGroup.add( line );
        }

        this._prevMarker = mesh;

        this._triggering = false;

    }

    useAxisChanged( data ) {

        let scale = this._wireframe.scale;
        let val = data.controller.sizeMesh.scale.x * 0.5;

        this._wireframe.scale.set( val, scale.y, scale.z );

    }

    onEnter() {

        this._selected = true;
        this._wireframe.visible = true;

    }

    onExit() {

        this._selected = false;
        this._wireframe.visible = false;

    }

    _createPath() {

        if ( this._points.length === 0 ) return;

        // Creates the path geometry from the positions.
        let geometry = buildPath( this._points, {
            uvFactor: 0.5,
            scale: this._wireframe.scale.x
        } );

        // Creates the mesh associated to the path.
        let material = WATER_MATERIAL.clone();
        let mesh = new THREE.Mesh( geometry, material );
        mesh.frustumCulled = false;
        mesh.drawMode = THREE.TrianglesDrawMode;

        let cubemap = AssetManager.assets.texture.cubemap.cubemap;
        mesh.material.uniforms.normalMap.value = AssetManager.assets.texture.tool.water_normal;
        mesh.material.uniforms.normalMap.value.wrapS = THREE.RepeatWrapping;
        mesh.material.uniforms.normalMap.value.wrapT = THREE.RepeatWrapping;
        mesh.material.uniforms.uSpeed.value = this.options.speed;
        mesh.material.uniforms.uCubemap.value = cubemap;
        mesh.material.needsUpdate = true;

        for ( let i = this._markerGroup.children.length - 1; i >= 0; i-- ) {
            this._markerGroup.remove( this._markerGroup.children[ i ] );
        }
        for ( let i = this._splineGroup.children.length - 1; i >= 0; i-- ) {
            this._splineGroup.remove( this._splineGroup.children[ i ] );
        }

        this._waterGroup.add( mesh );

        // Reinit attributes for next drawing.
        this._points.length = 0;
        this._prevMarker = null;

    }

}
