module.exports = function (grunt) {
  grunt.registerTask('prod', [
    //'copy:swaggercss',
    'replace:api',
    'compileAssets',
    'concat',
    'uglify',
    'cssmin',
    'sails-linker:prodJs',
    'sails-linker:prodStyles',
    'sails-linker:clientSideTemplates',
    'transifex:grottocenter'
  ]);
};
