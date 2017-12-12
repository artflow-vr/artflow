'use strict';

let path = require( 'path' );
let webpack = require( 'webpack' );

let ROOT = __dirname;
let SRC = ROOT + '/src';
let BUILD = 'build';

let ENTRY_FILE = SRC + '/index.js';
let OUTPUT_FILE = 'artflow-dist';

const INCLUDES = [
  'controller', 'modules', 'shader', 'utils', 'view', 'vr'
];

let env = require( 'dotenv' ).config();

let plugins = [
  new webpack.ProvidePlugin( {
    'THREE': 'three',
    'window.THREE': 'three'
  } )
];

let loaders = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    query: {
      presets: ['es2015']
    }
  }
];

/**
 * Creates the array containing the different include folders.
 * This is used to avoid having gross relative import!
 */
let aliases = {};
for ( let i = 0; i < INCLUDES.length; ++i )
  aliases[ INCLUDES[ i ] ] = path.resolve( SRC, INCLUDES[ i ] );
//test.push( path.resolve( ROOT, './node_modules' ) );

let exp = {
  entry: ENTRY_FILE,
  output: {
    path: path.resolve( __dirname, BUILD + '/' ),
    filename: null,
    publicPath: '/' + BUILD + '/',
    library: 'Artflow'
  },
  resolve: {
    alias: aliases
  },
  module: {}
};

if ( !env.parsed || env.parsed.WEBPACK_CONFIG !== 'build' ) {
    OUTPUT_FILE = OUTPUT_FILE + '.js';
    plugins.push( new webpack.HotModuleReplacementPlugin() );
} else {
  OUTPUT_FILE = OUTPUT_FILE + '.min.js';
  plugins.push( new webpack.optimize.UglifyJsPlugin( { minimize: true } ) );
  loaders.push( {
    test: /(\.jsx|\.js)$/,
    loader: 'eslint-loader',
    exclude: /node_modules/
  } );
}

exp.output.filename = OUTPUT_FILE;
exp.plugins = plugins;
exp.module.loaders = loaders;

module.exports = exp;
