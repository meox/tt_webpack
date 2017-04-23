var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    hello_world: './src/hello_world.js',
    ucq03: './src/ucq03.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name]_bundle.js',
    library: 'tt'
  },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
}; 
