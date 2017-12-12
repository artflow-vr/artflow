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

    constructor( pos, angle, hlu, step , orientation, pressure ) {

        this.pos = pos;
        this.angle = angle;
        this.hlu = hlu;
        this.step = step;
        this.orientation = orientation;
        this.pressure = pressure;

    }

}

class Tree {

    constructor ( options, hsv ) {

        this.states = [];
        this.helper = new BrushHelper( options );

        if ( hsv ) {
            this.helper.setColor( hsv );
        }

    }

    init( data, angle, step, str ) {

        let m = new THREE.Matrix3();
        m.set( 0, -1, 0,
               1, 0, 0,
               0, 0, 1 );

        this.pushState(
            data.position.world, angle, m, step, data.orientation, data.pressure
        );

        this.str = str;
        this.curIdx = 0;
        this.newMesh = false;
        this.time = 0;

    }

    pushState( pos, angle, hlu, step, orientation, pressure ) {

        let state = new State(
            pos.clone(), angle, hlu.clone(), step, orientation.clone(), pressure
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

    constructor() {

        super( {
            maxSpread: 20,
            brushThickness: 0.1,
            texture: null,
            enablePressure: true,
            color: 0x45220a,
            materialId: 'material_without_tex'
        } );

        this.dynamic = true;

        this.registerEvent( 'interact', {
            trigger: this.trigger.bind( this ),
            release: this.release.bind( this )
        } );

        this.registerEvent( 'colorChanged', ( hsv ) => {
            this._hsv = hsv;
        } );

        this._hsv = null;


        this.lSystems = {};

        this.lSystems.bush = new LSystem(
            'A',
            `A->[&FLA]\/\/\/\/\/[&FLA]\/\/\/\/\/\/\/[&FLA]
             F->S\/\/\/\/\/F
             S->F`,
            22.5 / 180.0 * Math.PI,
            7
        );

        this.lSystems.hilbertCube = new LSystem(
            'A',
            `A->B-F+CFC+F-D&F^D-F+&&CFC+F+B\/\/
             B->A&F^CFB^F^D^^-F-D^|F^B|FC^F^A\/\/
             C->|D^|F^B-F+C^F^A&&FA&F^C+F+B^F^D\/\/
             D->|CFB-F+B|FA&F^A&&FB-F+B|FC\/\/`,
             Math.PI / 2.0,
             2
        );

        this.lSystems.contextSensitive = new LSystem(
            'F',
            `F->F[-EF]E[+F]
             F<E->F[&F][^F]`,
             25.0 / 180.0 * Math.PI,
             4
        );

        this.lSystems.simpleTree = new LSystem(
            'X',
            `X->F[+X][-X]FX
             F->FF`,
             25.7 / 180.0 * Math.PI,
             5
        );

        this.lSystems.tiltTree = new LSystem(
            'F',
            'F->FF-[-F+F+F]+[+F-F-F]',
            22.5 / 180.0 * Math.PI,
            4
        );

        this._lSystem = this.lSystems.simpleTree;

        this._str = this._lSystem.derivate();

        this.step = 0.1;

        this.angle = this._lSystem.defaultAngle;

        this.interpretations = {
            'F': this.drawForward.bind( this ),
            'f': this.moveForward.bind( this ),
            '+': this.turnLeft.bind( this, 1.0 ),
            '-': this.turnLeft.bind( this, -1.0 ),
            '&': this.turnDown.bind( this, 1.0 ),
            '^': this.turnDown.bind( this, -1.0 ),
            '\\': this.rollLeft.bind( this, 1.0 ),
            '/': this.rollLeft.bind( this, -1.0 ),
            '|': this.turnAround.bind( this ),
            '[': this.pushState.bind( this ),
            ']': this.popState.bind( this )
        };

        this.trees = [];

        this.timePerSymbol = 10;

    }

    trigger() {

        let tree = new Tree( this.options, this._hsv );
        this.trees.push( tree );
        this._addMesh( tree );

    }

    release( data ) {

        let tree = this.trees[ this.trees.length - 1 ];

        if ( !tree ) return;

        tree.init( data, this.angle, this.step, this._str );
        this._draw( tree );

    }

    update( data ) {

        let toRemove = [];

        for ( let i = 0; i < this.trees.length; ++i ) {
            if ( this._interpretNext( i, data.delta ) )
                toRemove.push( i );
        }

        for ( let i of toRemove )
          this.trees.splice( i, 1 );

    }

    _addMesh( tree ) {

        let mesh = tree.helper.createMesh();
        this.worldGroup.addTHREEObject( mesh );
        return new AddCommand( this.worldGroup, mesh );

    }


    _interpretNext( treeIdx, delta ) {

        let tree = this.trees[ treeIdx ];
        if ( !tree || !tree.str ) return false;

        tree.time += delta;

        if ( !( tree.time / this.timePerSymbol ) ) return false;

        tree.time %= this.timePerSymbol;

        let i = tree.curIdx;
        tree.newMesh |= tree.str[ i ].symbol === ']'
                        || tree.str[ i ].symbol === 'f';

        let clbk = this.interpretations[ tree.str[ i ].symbol ];
        if ( clbk ) clbk( tree );

        return ++tree.curIdx >= tree.str.length;

    }

    _movePos( tree ) {

        let state = tree.peekState();
        state.pos.x += state.step * state.hlu.elements[ 0 ];
        state.pos.y += state.step * state.hlu.elements[ 1 ];
        state.pos.z += state.step * state.hlu.elements[ 2 ];

    }

    _draw( tree ) {

        let state = tree.peekState();
        tree.helper.addPoint(
            state.pos, state.orientation, state.pressure
        );

    }

    drawForward( tree ) {

        if ( tree.newMesh ) {
            this._addMesh( tree );
            this._draw( tree );
            tree.newMesh = false;
        }

        this._movePos( tree );
        this._draw( tree );

    }

    moveForward( tree ) {

        this._movePos( tree );

    }

    _updateAngle( tree, rmat ) {

        tree.peekState().hlu.multiply( rmat );

    }

    _getRuMatrix( angle ) {

        let m = new THREE.Matrix3();
        let c = Math.cos( angle );
        let s = Math.sin( angle );

        m.set(
            c, s, 0,
            -s, c, 0,
            0, 0, 1
        );

        return m;

    }

    turnLeft( sign, tree ) {

        let a = tree.peekState().angle * sign;
        let m = this._getRuMatrix( a );
        this._updateAngle( tree, m );

    }

    turnAround( tree ) {

        let m = this._getRuMatrix( Math.PI );
        this._updateAngle( tree, m );

    }


    turnDown( sign, tree ) {

        let m = new THREE.Matrix3();
        let a = sign * tree.peekState().angle;
        let c = Math.cos( a );
        let s = Math.sin( a );

        m.set(
            c, 0, -s,
            0, 1, 0,
            s, 0, c
        );

        this._updateAngle( tree, m );
    }

    rollLeft( sign, tree ) {

        let m = new THREE.Matrix3();
        let a = sign * tree.peekState().angle;
        let c = Math.cos( a );
        let s = Math.sin( a );

        m.set(
            1, 0, 0,
            0, c, -s,
            0, s, c
        );

        this._updateAngle( tree, m );
    }

    pushState( tree ) {

        let state = tree.peekState();
        tree.pushState(
            state.pos, state.angle, state.hlu, state.step, state.orientation,
            state.pressure
        );

    }

    popState( tree ) {

        tree.popState();

    }
}

