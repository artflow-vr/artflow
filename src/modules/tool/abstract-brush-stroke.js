'use strict';

import AddCommand from './command/add-command';
import BrushHelper from './helper/brush-helper';

export default class AbstractBrushStroke {

    constructor( isVR, material ) {

        this.mesh = null;
        this.isVR = isVR;

        let mat = material.clone();

        let optionsHelper = {
            isVR: this.isVR,
            maxSpread: 20,
            brushThickness: this.isVR ? 0.2 : 0.5,
            delta: this.isVR ? 0.01 : 0.005,
            enablePressure: false,
            material: mat
        };

        this._helper = new BrushHelper( optionsHelper );

    }

    update( ) {

    }

    use( data ) {

        this._helper.addPoint(
            data.position.world, data.orientation, data.pressure
        );

    }

    trigger( brushTool ) {

        this.mesh = this._helper.createMesh();
        brushTool.worldGroup.addTHREEObject( this.mesh );

        return new AddCommand( brushTool.worldGroup.object );

    }

    setColor( hsv ) {

        if ( this._helper )
            this._helper.setColor( hsv );

    }
}
