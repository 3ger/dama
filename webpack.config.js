const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

module.exports = {
   context: ROOT,

   entry: {
      'main': './main.ts'
   },

   output: {
      filename: '[name].bundle.js',
      path: DESTINATION
   },

   resolve: {
      extensions: ['.ts', '.js'],
      modules: [
         ROOT,
         'node_modules'
      ]
   },

   module: {
      rules: [
         {
            enforce: 'pre',
            test: /\.js$/,
            exclude: [/dist/, /node_modules/],
            use: 'source-map-loader'
         },
         {
            enforce: 'pre',
            test: /\.ts$/,
            exclude: [/node_modules/, /dist/],
            use: 'tslint-loader'
         },
         {
            test: /\.ts$/,
            exclude: [/node_modules/, /dist/],
            use: 'awesome-typescript-loader'
         },
         {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
            //include:[path.resolve(__dirname, '..', 'node_modules/monaco-editor')]
         },
      ]
   },

   devtool: 'source-map',
   devServer: {},
   plugins: [
      new MonacoWebpackPlugin()
   ]
};

