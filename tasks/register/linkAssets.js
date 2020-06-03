module.exports = function(grunt) {
  grunt.registerTask('linkAssets', [
    'sails-linker:devJs',
    'sails-linker:devStyles',
    // 'sails-linker:clientSideTemplates', // Templates are not used in Grottocenter currently
  ]);
};
