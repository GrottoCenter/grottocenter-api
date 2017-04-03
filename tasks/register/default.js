module.exports = function (grunt) {
  grunt.registerTask('default', [
    'eslint:dev',
    'lesshint:dev',
    'clean:dev',
    'copy:swagger',
    'replace:swaggerhtml',
    'compileAssets',
    'linkAssets',
    'watch']
  );
};
