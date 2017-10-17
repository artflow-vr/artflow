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
import AddCommand from './command/add-command';
import BrushHelper from './helper/brush-helper';
import { LSystem } from '../../utils/l-system';

class State {

    constructor( pos, angle, step , orientation, pressure ) {

        this.pos = pos;
        this.angle = angle;
        this.step = step;
        this.orientation = orientation;
        this.pressure = pressure;

    }

}

class Tree {

    constructor ( options ) {

        this.states = [];
        this.helper = new BrushHelper( options );

    }

    init( data, angle, step, str ) {

        this.pushState(
            data.position.world, Math.PI / 2, step, data.orientation,
            data.pressure
        );
        this.angle = angle;
        this.step = step;
        this.str = str;

    }

    pushState( pos, angle, step, orientation, pressure ) {

        let state = new State(
            pos.clone(), angle, step, orientation.clone(), pressure
        );
        this.states.push( state );

    }

    popState() {

        this.states.pop();

    }

    peekState() {

        return this.states[ this.states.length - 1 ];

    }
}

export default class TreeTool extends AbstractTool {

    constructor( options ) {

        super( options );

        this.registeredBrushes = null;

        this.setOptionsIfUndef( options, {
            maxSpread: 20,
            brushThickness: 0.1,
            enablePressure: true,
            color: 0x808080,
            materialId: 'material_without_tex'
        } );

        this.registerEvent( 'interact', {
            trigger: this.trigger.bind( this ),
            release: this.release.bind( this )
        } );


        //this._lSystem = new LSystem( '--F[+F][-F[-F]F]F[+F][-F]', '' );
        //this._lSystem = new LSystem( 'F-F-F-F-F', 'F->F-F+F+FF-F-F+F' );

        this.axiom = 'X';

        this.grammar = `X->F[+X][-X]FX
                        F->FF`;

        this._lSystem = new LSystem( this.axiom, this.grammar );

        this._str = this._lSystem.derivate( 5 );

        this.step = 0.25;

        this.angle = ( 25.7 / 360 ) * 2 * Math.PI;

        this.interpretations = {
            'F': this.drawForward.bind( this ),
            'f': this.moveForward.bind( this ),
            '+': this.turnLeft.bind( this ),
            '-': this.turnRight.bind( this ),
            '[': this.pushState.bind( this ),
            ']': this.popState.bind( this )
        };

        this.trees = [];
    }

    trigger() {

        let tree = new Tree( this.options );
        this.trees.push( tree );
        this._addMesh( tree );

    }

    release( data ) {

        let tree = this.trees[ this.trees.length - 1 ];
        tree.init( data, this.angle, this.step, this._str );
        this._draw( tree );
        this._interpretSbs( tree, 0 );

    }

    _addMesh( tree ) {

        let mesh = tree.helper.createMesh();
        this.worldGroup.addTHREEObject( mesh );
        return new AddCommand( this.worldGroup, mesh );

    }

    //_interpret( tree ) {

        //for ( let i = 0; i < tree.str.length; ++i ) {
            //let newMesh = i + 1 < tree.str.length
                          //&& tree.str[ i + 1 ].symbol !== ']'
                          //&& tree.str[ i + 1 ].symbol !== '[';
            //let clbk = this.interpretations[ tree.str[ i ].symbol ];
            //if ( clbk ) {
                //clbk( tree, newMesh );
            //}
        //}

        //this.trees.pop();

    //}

    _interpretSbs( tree, i ) {

        if ( i >= tree.str.length ) {
            this.trees.slice( this.trees.indexOf( tree ) );
            return;
        }

        let newMesh = i + 1 < tree.str.length
                      && tree.str[ i + 1 ].symbol !== ']'
                      && tree.str[ i + 1 ].symbol !== '[';
        let clbk = this.interpretations[ tree.str[ i ].symbol ];

        if ( clbk ) {
            clbk( tree, newMesh );
        }

        setTimeout( this._interpretSbs.bind( this, tree, i + 1 ), 3 );

    }

    _movePos( tree ) {

        let state = tree.peekState();
        state.pos.x += state.step * Math.cos( state.angle );
        state.pos.y += state.step * Math.sin( state.angle );

    }

    _draw( tree ) {

        let state = tree.peekState();
        tree.helper.addPoint(
            state.pos, state.orientation, state.pressure
        );

    }

    drawForward( tree ) {

        this._movePos( tree );
        this._draw( tree );

    }

    moveForward( tree ) {

        this._addMesh( tree );
        this._movePos( tree );

    }

    turnLeft( tree ) {

        tree.peekState().angle -= tree.angle;

    }

    turnRight( tree ) {

       tree.peekState().angle += tree.angle;
    }

    pushState( tree, newMesh ) {

        let state = tree.peekState();
        tree.pushState(
            state.pos, state.angle, state.step, state.orientation,
            state.pressure
        );

        if ( newMesh ) {
            this._addMesh( tree );
            this._draw( tree );
        }

    }

    popState( tree, newMesh ) {

        tree.popState();

        if ( newMesh ) {
            this._addMesh( tree );
            this._draw( tree );
        }

    }
}

TreeTool.registeredBrushes = [ {
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
