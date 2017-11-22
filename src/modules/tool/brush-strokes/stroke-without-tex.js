'use strict';

import AbstractBrushStroke from '../abstract-brush-stroke';

export default class StrokeWithoutTex extends AbstractBrushStroke {

    constructor( isVR ) {

        super( isVR, 'material_without_tex' );

    }
}