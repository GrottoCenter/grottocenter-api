module.exports = (grunt) => {
  grunt.config.set('eslint', {
    dev: {
      options: {
        overrideConfigFile: '.eslintrc.js',
      },
      src: ['**/*.js', '!node_modules/**'],
    },
  });

  grunt.loadNpmTasks('grunt-eslint');
};
