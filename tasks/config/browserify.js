module.exports = function(grunt) {

  grunt.config.set('browserify', {
    dev: {
      src: ['./assets/js/App.jsx'],
      dest: '.tmp/public/js/bundle.js',
      options: {
        watch : true, // use watchify for incremental builds!
        //  keepAlive : true, // watchify will exit unless task is kept alive
        //fullPaths: false,
        browserifyOptions: {
          debug: true, // source mapping
          extensions: ['.jsx', '.js']
        },
        transform: [
          ['babelify', {
            compact: false,
            presets: ['es2015', 'react']
          }]
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
};
