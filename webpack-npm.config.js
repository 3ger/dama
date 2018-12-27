const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'dist' );

module.exports = {
    context: ROOT,

    entry: {
        'main': 'main.ts'
    },

    output: {
        filename: 'main.bundle.js',
        path: DESTINATION
    },

    resolve: {
        extensions: ['.ts', '.js', '.css'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'awesome-typescript-loader'
            }
        ]
    },


};

