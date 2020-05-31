/**
 * LINT LESS files and generated CSS.
 *
 */
module.exports = function(grunt) {
  grunt.config.set('lesshint', {
    dev: {
      src: ['assets/styles/**/*.less'],
      options: {
        allowWarnings: true,
        lesshintrc: '.lesshintrc',
      },
    },
  });

  grunt.loadNpmTasks('grunt-lesshint');
};
