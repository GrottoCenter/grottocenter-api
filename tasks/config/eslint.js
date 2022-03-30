module.exports = function (grunt) {
  grunt.config.set('eslint', {
    dev: {
      src: ['**/*.js', '!node_modules/**/*'],
      options: {
        silent: true, // Do not stop grunt on error
        // quiet: true, // Do not display warnings
        fix: true,
      },
    },
  });

  grunt.loadNpmTasks('gruntify-eslint');
};
