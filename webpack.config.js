'use strict';

let webpack = require('webpack');

let ROOT = __dirname;
let SRC = ROOT + '/src';
let BUILD = ROOT + '/build';

let ENTRY_FILE = SRC + '/index.js';
let OUTPUT_FILE = BUILD + '/artflow-dist.js';

module.exports = {
 entry: ENTRY_FILE,
 output: {
    path: BUILD,
    filename: 'build.js'
  }
};
