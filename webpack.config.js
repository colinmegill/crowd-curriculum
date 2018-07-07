const path = require('path');
const webpack = require('webpack');

module.exports = {
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
  },

  devtool: 'source-map',

  mode: 'development',

  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: "awesome-typescript-loader",
      include: path.join(__dirname, 'src')
    }]
  },

  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    './src/client/index'
  ],

  output: {
    path: path.join(__dirname, 'dist-client'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
};
