module.exports = function(grunt) {
  grunt.registerTask('linkAssetsBuild', [
    'sails-linker:devJsBuild',
    'sails-linker:devStylesBuild',
    'sails-linker:clientSideTemplatesBuild',
  ]);
};
