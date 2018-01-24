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
import BrushHelper from './helper/brush-helper';
import { LSystem } from '../../utils/l-system';

const MAX_TREE = 3;
const INIT_MAT = new THREE.Matrix3();
INIT_MAT.set(
    0, -1, 0,
    1, 0, 0,
    0, 0, 1
);

class State {

    constructor( pos, hlu ) {

        this.pos = pos;
        this.hlu = hlu;

    }

}

class Tree {

    constructor () {

        this.activated = false;
        this.states = [];

    }

    init( data, lSysID, options, hsv ) {

        this.helper = new BrushHelper( options );
        this.helper.setColor( hsv );

        this.pushState(
            data.position.world, INIT_MAT
        );

        this.lSysID = lSysID;
        this.ori = data.orientation.clone();
        this.pres = data.pressure;

        this.curIdx = 0;
        this.newMesh = false;
        this.needPoint = false;
        this.time = 0;
        this.activated = true;

    }

    pushState( pos, hlu ) {

        let state = new State(
            pos.clone(), hlu.clone()
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
            enablePressure: false,
            color: 0x45220a,
            materialId: 'material_without_tex'
        } );

        this.dynamic = true;

        this.registerEvent( 'interact', {
            release: this.release.bind( this )
        } );

        this.registerEvent( 'axisChanged', {
            use: ( data ) => {
                this.options.brushThickness =
                data.controller.sizeMesh.scale.x * 0.2;
            }
        } );

        this.registerEvent( 'colorChanged', ( hsv ) => {
            this._hsv.h = hsv.h;
            this._hsv.s = hsv.s;
            this._hsv.v = hsv.v;
        } );

        this._hsv = {};


        this.lSystems = {};

        this.lSystems.bush = new LSystem(
            'A',
            `A->[&FLA]\/\/\/\/\/[&FLA]\/\/\/\/\/\/\/[&FLA]
             F->S\/\/\/\/\/F
             S->F`,
            22.5 / 180.0 * Math.PI,
            7,
            0.1,
            0.5
        );

        this.lSystems.hilbertCube = new LSystem(
            'A',
            `A->B-F+CFC+F-D&F^D-F+&&CFC+F+B\/\/
             B->A&F^CFB^F^D^^-F-D^|F^B|FC^F^A\/\/
             C->|D^|F^B-F+C^F^A&&FA&F^C+F+B^F^D\/\/
             D->|CFB-F+B|FA&F^A&&FB-F+B|FC\/\/`,
             Math.PI / 2.0,
             2,
             0.5,
             1
        );

        this.lSystems.contextSensitive = new LSystem(
            'F',
            `F->F[-EF]E[+F]
             F<E->F[&F][^F]`,
             25.0 / 180.0 * Math.PI,
             4,
             0.1,
             1
        );

        this.lSystems.simpleTree = new LSystem(
            'X',
            `X->F[+X][-X]FX
             F->FF`,
             25.7 / 180.0 * Math.PI,
             5,
             0.1,
             1
        );

        this.lSystems.tiltTree = new LSystem(
            'F',
            'F->FF-[-F+F+F]+[+F-F-F]',
            22.5 / 180.0 * Math.PI,
            3,
            0.1,
            1
        );

        this.onItemChanged( 'simpleTree' );

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

        for ( let i = 0; i < MAX_TREE; ++i ) {
            this.trees.push( new Tree() );
        }

        this.m = new THREE.Matrix3();

    }


    release( data ) {

        let i = 0;

        for ( ; i < MAX_TREE; ++i ) {
          if ( !this.trees[ i ].activated ) break;
        }

        if ( i >= MAX_TREE )
          return;

        let tree = this.trees[ i ];
        tree.init( data, this._lSysID, this.options, this._hsv );

        this._addMesh( tree );
        this._draw( tree );

    }

    update( data ) {

        let toRemove = [];

        for ( let i = 0; i < MAX_TREE; ++i ) {
            if ( this._interpretNext( i, data.delta ) )
                toRemove.push( i );
        }

        for ( let i of toRemove ) {
            if ( this.trees[ i ].needPoint ) this._draw( this.trees[ i ] );
            this.trees[ i ].activated = false;
            this.trees[ i ].states.length = 0;
        }

    }

    onItemChanged( itemID ) {

        this._lSysID = itemID;
        this.lSystems[ itemID ].derivate();

    }

    _addMesh( tree ) {

        let mesh = tree.helper.createMesh();
        this.worldGroup.addTHREEObject( mesh );
        //return new AddCommand( this.worldGroup.object );

    }

    _interpretNext( treeIdx, delta ) {

        let tree = this.trees[ treeIdx ];

        if ( !tree.activated ) return false;
        if ( tree.lSysID === undefined ) return false;

        tree.time += delta * 100.0;

        let speed = this.lSystems[ tree.lSysID ].defaultSpeed;

        if ( !( tree.time / speed ) ) return false;

        tree.time %= speed;

        let i = tree.curIdx;

        let str = this.lSystems[ tree.lSysID ].resAxiom;
        let clbk = this.interpretations[ str[ i ].symbol ];
        if ( clbk ) clbk( tree );

        return ++tree.curIdx >= str.length;

    }

    _movePos( tree ) {

        let state = tree.peekState();
        state.pos.x += this.lSystems[ tree.lSysID ].defaultStep * state.hlu.elements[ 0 ];
        state.pos.y += this.lSystems[ tree.lSysID ].defaultStep * state.hlu.elements[ 1 ];
        state.pos.z += this.lSystems[ tree.lSysID ].defaultStep * state.hlu.elements[ 2 ];

    }

    _draw( tree ) {

        let state = tree.peekState();
        tree.helper.addPoint(
            state.pos, tree.ori, tree.pres
        );
        tree.needPoint = false;

    }

    drawForward( tree ) {

        if ( tree.newMesh ) {
            this._addMesh( tree );
            this._draw( tree );
            tree.newMesh = false;
        } else if ( tree.needPoint ) {
          this._draw( tree );
        }

        this._movePos( tree );

    }

    moveForward( tree ) {

        tree.newMesh = true;
        this._movePos( tree );

    }

    _updateAngle( tree ) {

        tree.needPoint = true;
        tree.peekState().hlu.multiply( this.m );

    }

    _getRuMatrix( angle ) {

        let c = Math.cos( angle );
        let s = Math.sin( angle );

        this.m.set(
            c, s, 0,
            -s, c, 0,
            0, 0, 1
        );

    }

    turnLeft( sign, tree ) {

        let a = this.lSystems[ tree.lSysID ].defaultAngle * sign;
        this._getRuMatrix( a );
        this._updateAngle( tree );

    }

    turnAround( tree ) {

        this._getRuMatrix( Math.PI );
        this._updateAngle( tree );

    }


    turnDown( sign, tree ) {

        let a = this.lSystems[ tree.lSysID ].defaultAngle * sign;
        let c = Math.cos( a );
        let s = Math.sin( a );

        this.m.set(
            c, 0, -s,
            0, 1, 0,
            s, 0, c
        );

        this._updateAngle( tree );
    }

    rollLeft( sign, tree ) {

        let a = this.lSystems[ tree.lSysID ].defaultAngle * sign;
        let c = Math.cos( a );
        let s = Math.sin( a );

        this.m.set(
            1, 0, 0,
            0, c, -s,
            0, s, c
        );

        this._updateAngle( tree );
    }

    pushState( tree ) {

        let state = tree.peekState();
        tree.pushState(
            state.pos, state.hlu
        );

    }

    popState( tree ) {

        if ( tree.needPoint ) this._draw( tree );
        tree.popState();
        tree.newMesh = true;

    }
}

