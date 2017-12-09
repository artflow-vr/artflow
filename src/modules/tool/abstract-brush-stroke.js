'use strict';

import AddCommand from './command/add-command';
import BrushHelper from './helper/brush-helper';

export default class AbstractBrushStroke {

    constructor( isVR, materialId = 'material_with_tex' ) {

        this._helper = null;

        this.mesh = null;

        this.isVR = isVR;
        this.materialId = materialId;

        let options = {
            isVR: this.isVR,
            maxSpread: 20,
            brushThickness: this.isVR ? 0.2 : 0.5,
            delta: this.isVR ? 0.01 : 0.005,
            enablePressure: false,
            color: 0x808080,
            materialId: this.materialId
            //materialId: 'material_with_tex'
        };

        this._helper = new BrushHelper( options );

    }

    update( data ) {

    }

    use( data ) {

        this._helper.addPoint( data.position.world, data.orientation, data.pressure );

    }

    trigger( brushTool ) {

        this.mesh = this._helper.createMesh();

        //this.helper = new THREE.VertexNormalsHelper( this.mesh, 1, 0xff0000, 1 );

        //this.worldGroup.addTHREEObject( this.helper );
        brushTool.worldGroup.addTHREEObject( this.mesh );

        return new AddCommand( brushTool.worldGroup, this.mesh );

    }
}
