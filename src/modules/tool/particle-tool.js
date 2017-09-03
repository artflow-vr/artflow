import AbstractTool from './abstract-tool';
import {
    AssetManager
} from '../../utils/asset-manager';

export default class ParticleTool extends AbstractTool {

    constructor( options ) {

        super( options );
        this.setOptionsIfUndef( {
            brushSize: 1,
            thickness: 2
        } );

        this._position = new THREE.Vector3( 0, 0, 0 );

        this._cursorMesh = new THREE.Mesh(
            new THREE.SphereGeometry( this.options.brushSize, 16, 16, 0,
                Math.PI * 2, 0, Math.PI * 2 ),
            new THREE.MeshBasicMaterial( {
                color: 0xfff0000,
                wireframe: true
            } )
        );

        this._cursorMesh.castShadow = false;
        this._cursorMesh.receiveShadow = false;

        // Initializing particles
        this._particleTexture = AssetManager.assets.texture.particle_raw;
        this._particleCount = this.options.brushSize * this.options.thickness;
        this._pMaterial = new THREE.PointsMaterial( {
            color: 0xFFFFFF,
            size: 0.1,
            map: this._particleTexture,
            blending: THREE.AdditiveBlending,
            transparent: true
        } );

        let self = this;
        this.registerEvent( 'interact', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self ),
            release: self.release.bind( self )
        } );

        this.worldGroup.addTHREEObject( this._cursorMesh );

    }

    use( data ) {
        this._updateBrush( data.position.world );

        // Create the particles
        // TODO: This loop is really bad for performance reasons.
        // it is only a POC. We should not allocate new geometry in ArtFlow.
        // We should only create meshes, and reuse geometries.
        let particles = new THREE.Geometry();
        for ( let p = 0; p < this._particleCount; p++ ) {

            // create a particle with random
            // position values, -250 -> 250
            let offsetX = Math.random() * this.options.brushSize - this.options
                .brushSize / 2,
                offsetY = Math.random() * this.options.brushSize - this.options
                .brushSize / 2,
                offsetZ = Math.random() * this.options.brushSize - this.options
                .brushSize / 2,
                particle =
                new THREE.Vector3(
                    this._cursorMesh.position.x + offsetX,
                    this._cursorMesh.position.y + offsetY,
                    this._cursorMesh.position.z + offsetZ
                );

            // add it to the geometry
            particles.vertices.push( particle );
        }

        // create the particle system
        let particleSystem = new THREE.Points(
            particles,
            this._pMaterial );

        // add it to the scene
        this.worldGroup.addTHREEObject( particleSystem );
    }

    _updateBrush( pointCoords ) {
        this._cursorMesh.position.x = pointCoords.x;
        this._cursorMesh.position.y = pointCoords.y;
        this._cursorMesh.position.z = pointCoords.z;
    }

    update() {}

    trigger() {}

    release() {}

}
