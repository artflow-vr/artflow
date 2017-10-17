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

        this._helper = new BrushHelper( options );

        this.registerEvent( 'interact', {
            trigger: this.trigger.bind( this ),
            release: this.release.bind( this )
        } );

        this.mesh = null;

        this._lSystem = new LSystem( '--F[+F][-F[-F]F]F[+F][-F]', '' );
        //this._lSystem = new LSystem( 'F-F-F-F-F', 'F->F-F+F+FF-F-F+F' );

        this._step = 1;

        this._angle = Math.PI / 4;

        this.interpretations = {
            'F': this.drawForward,
            'f': this.moveForward,
            '+': this.turnLeft,
            '-': this.turnRight,
            '[': this.pushState,
            ']': this.popState
        };

        this.states = [];
    }

    trigger() {

        this.mesh = this._helper.createMesh();
        this.worldGroup.addTHREEObject( this.mesh );
        return new AddCommand( this.worldGroup, this.mesh );

    }

    release( data ) {

        let res = this._lSystem.derivate( 0 );
        let state = new State(
          data.position.world.clone(), 0, this._step,
          data.orientation, data.pressure
        );
        this.states.push( state );
        this._draw( state );
        this._interpret( res );
        this.states.pop();
    }

    _interpret( str ) {

        for ( let i = 0; i < str.length; ++i ) {
            let newMesh = i + 1 < str.length && str[ i + 1 ].symbol !== ']'
                          && str[ i + 1 ].symbol !== '[';
            this.interpretations[ str[ i ].symbol ].call( this, newMesh );
        }

    }

    _movePos( state ) {

        state.pos.x += state.step * Math.cos( state.angle );
        state.pos.y += state.step * Math.sin( state.angle );

    }

    _draw( state ) {

        this._helper.addPoint(
            state.pos, state.orientation, state.pressure
        );
}

    drawForward() {
        let state = this.states[ this.states.length - 1 ];
        this._movePos( state );
        this._draw( state );
    }

    moveForward() {

        this.trigger();
        this._movePos( this.states[ this.states.length - 1 ] );

    }

    turnLeft() {

        this.states[ this.states.length - 1 ].angle -= this._angle;

    }

    turnRight() {

        this.states[ this.states.length - 1 ].angle += this._angle;
    }

    pushState( newMesh ) {

        let state = this.states[ this.states.length - 1 ];
        let newState = new State(
            state.pos.clone(), state.angle, state.step, state.orientation,
            state.pressure
          );
        this.states.push( newState );

        if ( newMesh ) {
            this.trigger();
            this._draw( newState );
        }
    }

    popState( newMesh ) {

        this.states.pop();

        if ( newMesh ) {
            this.trigger();
            this._draw( this.states[ this.states.length - 1 ] );
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
