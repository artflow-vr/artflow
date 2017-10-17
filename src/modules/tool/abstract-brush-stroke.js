'use strict';

import AddCommand from './command/add-command';
import BrushHelper from './helper/brush-helper';

export default class AbstractBrushStroke {

    constructor( isVR ) {

        this._helper = null;

        this.mesh = null;

        this.isVR = isVR;

        let options = {
            isVR: this.isVR,
            maxSpread: 20,
            brushThickness: this.isVR ? 0.2 : 0.5,
            delta: this.isVR ? 0.01 : 0.05,
            enablePressure: false,
            color: 0x808080,
            materialId: 'material_with_tex'
        };

        this._helper = new BrushHelper( options );

    }

    update( data ) {

    }

    use( data ) {

        this._helper.addPoint( data.position.world, data.orientation, data.pressure );

        /*let normals = this.mesh.normals;
        let vertices = this.mesh.vertices;
      
        for ( let j = 0; j < 2; j++ ) {
            let i = this.i;
            let norm = new THREE.Vector3( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );
            let vertex = new THREE.Vector3( vertices[ i ], vertices[ i + 1 ], vertices[ i + 2 ] );
            this.i += 3;
      
            let dir = vertex.clone().sub( norm );
      
            let arrowHelper = new THREE.ArrowHelper( dir.normalize(), vertex, dir.length(), 0xff0000 );
      
            this.worldGroup.addTHREEObject( arrowHelper );
        }*/

        //this.helper.update();

    }

    trigger( brushTool ) {

        this.mesh = this._helper.createMesh();

        //this.helper = new THREE.VertexNormalsHelper( this.mesh, 1, 0xff0000, 1 );

        //this.worldGroup.addTHREEObject( this.helper );
        brushTool.worldGroup.addTHREEObject( this.mesh );

        return new AddCommand( brushTool.worldGroup, this.mesh );

    }
}
