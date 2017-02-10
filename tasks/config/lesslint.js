/**
 * LINT LESS files and generated CSS.
 *
 */
module.exports = function(grunt) {

  grunt.config.set('lesslint', {
    dev: {
      src: ['assets/styles/**/*.less'],
      options: {
        failOnWarning: false,
        csslint: {
          csslintrc: '.csslintrc'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-lesslint');
};
