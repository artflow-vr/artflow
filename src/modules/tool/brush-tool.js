'use strict';

let THREE = window.THREE;

let AbstractTool = require( './abstract-tool' );
let AddCommand = require( './command/add-command' );
let BrushHelper = require( './helper/brush-helper' );

function BrushTool( options ) {

    AbstractTool.call( this, null );

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
BrushTool.prototype = Object.create( AbstractTool.prototype );
BrushTool.prototype.constructor = BrushTool;

BrushTool.prototype.update = function () {
    // TODO: Fills with dynamic brushes
};

BrushTool.prototype.use = function ( data ) {

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

};

BrushTool.prototype.trigger = function ( ) {

    this.i = 0;
    this.mesh = this._helper.createMesh();

    //this.helper = new THREE.VertexNormalsHelper( this.mesh, 1, 0xff0000, 1 );

    //this.worldGroup.addTHREEObject( this.helper );
    this.worldGroup.addTHREEObject( this.mesh );

    return new AddCommand( this.worldGroup, this.mesh );

};

BrushTool.registeredBrushes = [
    {
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

module.exports = BrushTool;
