module.exports = function(grunt) {
  grunt.registerTask('linkAssetsBuildProd', [
    'sails-linker:prodJsBuild',
    'sails-linker:prodStylesBuild',
    // 'sails-linker:clientSideTemplatesBuild', // Templates are not used in Grottocenter currently
  ]);
};
