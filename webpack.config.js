'use strict';

let path = require( 'path' );
let webpack = require( 'webpack' );

let ROOT = __dirname;
let SRC = ROOT + '/src';
let BUILD = 'build';

let ENTRY_FILE = SRC + '/index.js';
let OUTPUT_FILE = 'artflow-dist.js';

module.exports = {
 entry: ENTRY_FILE,
 output: {
    path: path.resolve( __dirname, BUILD + '/' ),
    filename: OUTPUT_FILE,
    publicPath: '/' + BUILD + '/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};
