const webpackConfig = require('./webpack-test.config.js');
webpackConfig.mode = 'production';

module.exports = function(config) {
  config.set({
    singleRun: false,
    random: true,

    browsers: [
      'Chrome'
    ],

    frameworks: [
      'jasmine'
    ],

    files: [
      'spec.bundle.js'
    ],

    preprocessors: {
      'spec.bundle.js': ['webpack']
    },

    webpack: webpackConfig,

    webpackMiddleware: {
      stats: 'errors-only'
    },

    client: {
      clearContext: false
    },

    reporters: ['mocha', 'kjhtml'],

    plugins: [
      require('karma-jasmine'),
      require('karma-webpack'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-mocha-reporter')
    ]
  });
};
