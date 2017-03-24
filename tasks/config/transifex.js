module.exports = function(grunt) {
  'use strict';
  let configLocal = require('../../config/i18n.js'), _ = require('underscore');

  grunt.config.set('transifex', {
    'grottocenter': {
      options: {
        targetDir: './config/locales/',
        resources: ['v3_localisation'],
        languages: configLocal.i18n.locales,
        filename: '_lang_.json',
        templateFn: function(strings) {
          return JSON.stringify(_.object(_.pluck(strings, 'key'), _.pluck(strings, 'translation')), null, '\t');
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-transifex');
};
