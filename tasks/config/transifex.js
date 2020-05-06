module.exports = function(grunt) {
  'use strict';
  let configLocal = require('../../config/i18n.js'),
    _ = require('underscore');

  grunt.config.set('transifex', {
    grottocenter: {
      options: {
        targetDir: './config/locales/',
        resources: ['v3_localisation'],
        languages: configLocal.i18n.locales,
        filename: '_lang_.json',
        templateFn: function(strings) {
          strings.sort((a, b) => a.key.localeCompare(b.key));
          const keys = _.pluck(strings, 'key');
          const translationValues = _.pluck(strings, 'translation');
          const obj = _.object(keys, translationValues);
          return JSON.stringify(obj, null, '\t');
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-transifex');
};
