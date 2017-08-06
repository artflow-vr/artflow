'use strict';

let vrNamespace = require( './vr/vr' );
let modulesNamespace = require( './modules/modules' );
let viewNamespace = require( './view/view' );
let utilsNamespace = require( './utils/utils' );

let Artflow = module.exports;
Artflow.vr = vrNamespace;
Artflow.modules = modulesNamespace;
Artflow.view = viewNamespace;
Artflow.utils = utilsNamespace;
