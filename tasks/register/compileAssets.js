module.exports = function(grunt) {
  grunt.registerTask('compileAssets', [
    'jst:dev',
    'less:dev',
    'copy:dev',
    'copy:rcSliderCss',
    'browserify:dev'
  ]);
};
