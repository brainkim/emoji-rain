const path = require('path');
const webpack = require('webpack');

const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');
const precss = require('precss');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const htmlPlugin = new HtmlWebpackPlugin({
  title: 'Body Cameras',
  filename: 'index.html',
  template: path.join(__dirname, '../src/html/index.html'),
  inject: true
});
const extractTextPlugin = new ExtractTextWebpackPlugin( 'assets/[name]-[contenthash].css', {
  disable: !isProduction
});

module.exports = {
  context: path.resolve(__dirname, '../'),
  devtool: '#source-map',
  entry: {
    app: isProduction
      ? './src/js/app.js'
      : [
        'webpack-hot-middleware/client?path=/__poop&timeout=10000',
        './src/js/app.js',
      ],
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.css$/,
        loader: extractTextPlugin.extract('style-loader', ['css-loader', 'postcss-loader'])
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: 'file',
        query: {
          name: isProduction ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
        }
      },
    ]
  },

  output: isProduction ? {
    path: path.resolve(__dirname, '../dist'),
    // NOTE(brian): change this to the path you use to host it b/c webpack is horrible.
    publicPath: '/',
    // publicPath: 'http://dracula2000.s3.amazonaws.com/demos/bodycams/',
    filename: 'assets/[name].[chunkhash].js'
  } : {
    path: path.resolve(__dirname, '../build'),
    publicPath: '/',
    filename: 'assets/[name].js'
  },

  plugins: isProduction ?  [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    htmlPlugin,
    extractTextPlugin,
  ] : [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    htmlPlugin,
    extractTextPlugin,
  ],

  postcss: function() {
    return [
      autoprefixer,
      precss,
      postcssImport({ addDependencyTo: webpack })
    ];
  },
};
