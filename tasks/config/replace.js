/**
 * Copy files and folders.
 *
 * ---------------------------------------------------------------
 *
 * # dev task config
 * Copies all directories and files, exept coffescript and less fiels, from the sails
 * assets folder into the .tmp/public directory.
 *
 * # build task config
 * Copies all directories nd files from the .tmp/public directory into a www directory.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-copy
 */
module.exports = function(grunt) {
  grunt.config.set('replace', {
    apiDev: {
      src: ['apiV*.yaml'], // source files array (supports minimatch)
      dest: 'assets/swagger/', // destination directory or file
      replacements: [
        {
          from: 'beta.grottocenter.org', // string replacement
          to: 'localhost:1337',
        },
      ],
    },
    api: {
      src: ['apiV*.yaml'], // source files array (supports minimatch)
      dest: 'assets/swagger/', // destination directory or file
      replacements: [
        {
          from: 'localhost:1337', // string replacement
          to: 'beta.grottocenter.org',
        },
      ],
    },
  });
  grunt.loadNpmTasks('grunt-text-replace');
};
