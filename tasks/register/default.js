module.exports = function (grunt) {
  grunt.registerTask('default', ['copy:swagger', 'replace:swaggerhtml', 'compileAssets', 'linkAssets', 'watch']);
};
