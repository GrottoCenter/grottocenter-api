module.exports = function (grunt) {
  grunt.registerTask('default', [
    'transifex:grottocenter',
    'eslint:dev',
    'lesshint:dev',
    'clean:dev',
    //'copy:swaggercss',
    'replace:apiDev',
    'compileAssets',
    'linkAssets',
    'watch'
  ]);
};
