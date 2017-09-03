import AbstractTool from './abstract-tool';
import AddCommand from './command/add-command';
import BrushHelper from './helper/brush-helper';

export default class BrushTool extends AbstractTool {

    constructor( options ) {

        super( null );

        this.registeredBrushes = null;

        this._helper = new BrushHelper( options );

        // The code below links the teleporter method to the associated events.
        let self = this;
        this.registerEvent( 'interact', {
            use: self.use.bind( self ),
            trigger: self.trigger.bind( self )
        } );

        this.helper = null;

        this.mesh = null;
        this.i = 0;

    }

    use( data ) {

        this._helper.addPoint( data.position.world,
            data.orientation, data.pressure );

    }

    trigger() {

        this.i = 0;
        this.mesh = this._helper.createMesh();
        this.worldGroup.addTHREEObject( this.mesh );

        return new AddCommand( this.worldGroup, this.mesh );

    }

}

BrushTool.registeredBrushes = [ {
        maxSpread: 20,
        brushThickness: 0.5,
        enablePressure: false,
        color: 0x808080,
        materialId: 'material_with_tex'
    },
    {
        maxSpread: 20,
        brushThickness: 0.5,
        texture: null,
        enablePressure: true,
        color: 0x808080,
        materialId: 'material_without_tex'
    }
];
