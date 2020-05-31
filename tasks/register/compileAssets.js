module.exports = function(grunt) {
  grunt.registerTask('compileAssets', [
    'jst:dev',
    'less:dev',
    'copy:dev',
    'copy:rcSliderCss',
    'copy:swaggercss',
    'browserify:dev',
  ]);
};
