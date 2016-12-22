module.exports = function (grunt) {
  grunt.registerTask('default', ['clean:dev', 'copy:swagger', 'replace:swaggerhtml', 'compileAssets', 'linkAssets', 'watch']);
};
