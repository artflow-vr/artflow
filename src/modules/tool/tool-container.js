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

import MainView from '../../view/main-view';
import AbstractTool from './abstract-tool';

class ToolContainer extends AbstractTool {

    constructor( instanceType, options ) {
        super( options );
        this._instanceType = instanceType;
        this._variants = {};
        this.toolIcon = null;
        this.selected = 0;
        this._registerBasicTools( options );
        this.registerEvent( 'interact', {
            use: this.use.bind( this ),
            trigger: this.trigger.bind( this ),
            release: this.release.bind( this )
        } );
    }

    register( variantID, options ) {

        if ( variantID in this._variants ) {
            let errorMsg = 'you already registered the tool variant \'' +
                variantID +
                '\'';
            throw Error( 'ToolContainer: ' + errorMsg );
        }

        let instance = new this._instanceType( options );
        this._variants[ variantID ] = instance;


        // Adds tool's view groups to the root scene and the moving group.
        MainView.addToMovingGroup( instance.worldGroup.getObject() );
        MainView.addToScene( instance.localGroup.getObject() );

    }

    update( data ) {
        let tool = this._variants[ this.selected ];
        if ( tool && tool.update ) {
            tool.update( data );
        }
    }

    _registerBasicTools( options ) {

        this.register( 'Particle1', options );
        this.selected = 'Particle1';

    }

    use () {
        let tool = this._variants[ this.selected ];
        if ( tool && tool.update ) {
            tool.use();
        }
    }

    trigger() {
        let tool = this._variants[ this.selected ];
        if ( tool && tool.update ) {
            tool.trigger();
        }
    }

    release() {
        let tool = this._variants[ this.selected ];
        if ( tool && tool.update ) {
            tool.release();
        }
    }

}

export default ToolContainer;
