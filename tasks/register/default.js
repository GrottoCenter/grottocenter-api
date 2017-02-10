module.exports = function (grunt) {
  grunt.registerTask('default', [
    'lesslint:dev',
    'clean:dev',
    'copy:swagger',
    'replace:swaggerhtml',
    'compileAssets',
    'linkAssets',
    'watch']
  );
};
