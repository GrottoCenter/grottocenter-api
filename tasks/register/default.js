module.exports = function (grunt) {
  grunt.registerTask('default', [
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
