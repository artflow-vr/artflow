'use strict';

let vrNamespace = require( './vr/vr' );
let controlsNamespace = require( './controls/controls' );

let Artflow = {};
Artflow.vr = vrNamespace;
Artflow.controls = controlsNamespace;

module.exports = Artflow;
