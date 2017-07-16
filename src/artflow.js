'use strict';

let vrNamespace = require( './vr/vr' );
let controlsNamespace = require( './controls/controls' );
let generationNamespace = require( './generation/generation' );

let Artflow = {};
Artflow.vr = vrNamespace;
Artflow.controls = controlsNamespace;
Artflow.generation = generationNamespace;

module.exports = Artflow;
