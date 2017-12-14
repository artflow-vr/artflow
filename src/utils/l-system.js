/**
* ArtFlow application
* https://github.com/artflow-vr/artflow
*
* MIT License
*
* Copyright ( c ) 2017 artflow
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files ( the "Software" ), to deal
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

class Letter {

  constructor( symbol, parameters = [] ) {

    this.symbol = symbol;
    this.parameters = parameters;

  }

  match( rhs ) {

    return this.symbol === rhs.symbol
      && this.parameters.length === rhs.parameters.length;

  }

  isEqual( rhs ) {

    if ( !this.match( rhs ) )
      return false;

    for ( let i = 0; i < this.parameters.length; ++i ) {
      if ( this.parameters[ i ] !== rhs.parameters[ i ] )
        return false;
    }

    return true;
  }

}

class Production {

  constructor( leftCtx, pred, rightCtx, cond, prob, succ,
                formalToActual = {} ) {

    this.leftCtx = leftCtx;
    this.pred = pred;
    this.rightCtx = rightCtx;
    this.cond = cond;
    this.prob = prob;
    this.succ = succ;
    this.formalToActual = formalToActual;

  }

  match( axiom, index ) {

    let l = axiom[ index ];

    if ( !this.pred.match( l ) )
      return false;

    if ( this.leftCtx && !this.matchLeftCtx( axiom, index ) )
      return false;

    if ( this.rightCtx && !this.matchRightCtx( axiom, index ) )
      return false;

    return !( this.cond && !this.cond( axiom, index ) );

  }

  matchLetters( lhs, rhs ) {

    for ( let i = 0; i < lhs.length; ++i ) {
      if ( !lhs[ i ].isEqual( rhs[ i ] ) )
        return false;
    }

    return true;

  }

  _isBracket( l ) {

    return l === '[' || l === ']';

  }

  matchLeftCtx( axiom, index ) {

    let aIdx = index - 1;
    let cLen = this.leftCtx.length;
    let cIdx = cLen - 1;

    for ( ; aIdx >= 0 && cIdx >= 0; --aIdx, --cIdx ) {

      while ( aIdx >= 0 && this._isBracket( axiom[ aIdx ] ) )
        --aIdx;

      if ( aIdx < 0 && !axiom[ aIdx ].match( this.leftCtx[ cIdx ] ) )
        return false;
    }

    return true;
  }

  matchRightCtx( axiom, index ) {

    let aLen = axiom.length;
    let aIdx = index + 1;
    let cLen = this.leftCtx.length;
    let cIdx = 0;

    for ( ; aIdx < aLen && cIdx < cLen; ++aIdx, ++cIdx ) {

      while ( aIdx < aLen && this._isBracket( axiom[ aIdx ] ) )
        ++aIdx;

      if ( aIdx >= aLen && !axiom[ aIdx ].match( this.leftCtx[ cIdx ] ) )
        return false;
    }

    return true;

  }

  result() {

    return this.succ;

  }

}

class Parser {

  static parseMultiple( str, re , clbk ) {

     if ( !str )
      return null;

    let matches = str.match( re );
    return matches !== null ? matches.map( clbk, this ) : null;

  }

  static parseLetter( str ) {

    if ( !str )
      return null;

    // Handle operations later.
    let re = /([a-zA-Z+-\[\]^&\\\/|])(?:\(((?:[a-zA-Z]|[0-9])+(?:,(?:[a-zA-Z]|[0-9])+)*)\))?/;
    let matches = str.match( re );
    if ( !matches )
      return null;

    let parameters = matches[ 2 ] ? matches[ 2 ].split( ',' ) : [];
    return new Letter( matches[ 1 ], parameters );

  }

  static parseLetters( str ) {

    let re = /([a-zA-Z+-\[\]^&\\\/|])(?:\(((?:[a-zA-Z]|[0-9])+(?:,(?:[a-zA-Z]|[0-9])+)*)\))?/g;
    return this.parseMultiple( str, re, this.parseLetter );

  }

  static parseCond() {

    return () => {
      return true;
    };

  }

  static parseProduction( str ) {

    if ( !str )
      return null;

    let re = /(?:(.+)<)?(.+)(?:>(.+))?(:.+)?->({[0-9]+})?(.+)/;
    let matches = str.match( re );
    if ( !matches )
      return null;

    return new Production( this.parseLetters( matches[ 1 ] ),
                           this.parseLetter( matches[ 2 ] ),
                           this.parseLetters( matches[ 3 ] ),
                           this.parseCond( matches[ 4 ] ),
                           parseInt( matches[ 5 ], 10 ) || 1,
                           this.parseLetters( matches[ 6 ] ) );

  }

  static parseProductions( str ) {

    let re = /(.+<)?(.+)(>.+)?(:.+)?->({[0-9]+})?(.+)/g;
    return this.parseMultiple( str, re, this.parseProduction );

  }

}

class LSystem {

    constructor( axiom, productions, defaultAngle, defaultN, defaultStep,
                 defaultSpeed ) {

      this.axiom = Parser.parseLetters( axiom );
      this.productions = Parser.parseProductions( productions );
      this.defaultAngle = defaultAngle;
      this.defaultN = defaultN;
      this.defaultStep = defaultStep;
      this.defaultSpeed = defaultSpeed;

    }

    derivate( n ) {

      let nIte = n === undefined ? this.defaultN : n;
      let prevAxiom = JSON.parse( JSON.stringify( this.axiom ) );

      for ( let k = 0; k < nIte; ++k ) {
        let newAxiom = [];

        for ( let i = 0; i < prevAxiom.length; ++i ) {
          let found = false;

          for ( let j = 0; j < this.productions.length; ++j ) {
            if ( this.productions[ j ].match( prevAxiom, i ) ) {
              newAxiom = newAxiom.concat( this.productions[ j ]
                                          .result() );
              found = true;
              break;
            }
          }

          if ( !found )
            newAxiom.push( prevAxiom[ i ] );
        }

        prevAxiom = newAxiom;
    }

    return prevAxiom;
  }

  reverse( axiom ) {
    let res = [];

    for ( let i = axiom.length - 1; i >= 0; --i ) {
      if ( axiom[ i ].symbol === '+' ) {
        res.push( new Letter( '-', axiom[ i ].parameters ) );
      } else if ( axiom[ i ].symbol === '-' ) {
        res.push( new Letter( '+', axiom[ i ].parameters ) );
      } else {
        res.push( axiom[ i ] );
      }
    }

    return res;
  }
}

export {
  LSystem
};
