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
    swaggerhtml: {
      src: ['node_modules/swagger-ui/dist/index.html'],             // source files array (supports minimatch)
      dest: 'assets/swagger/index.html',             // destination directory or file
      replacements: [{
        from: 'http://petstore.swagger.io/v2/swagger.json',                   // string replacement
        to: 'http://localhost:1337/swagger/doc'
      }]
    }
  });
  grunt.loadNpmTasks('grunt-text-replace');
};
