module.exports = function(grunt) {

  grunt.config.set('browserify', {
    dev: {
      src: ['./assets/js/react/App.jsx'],
      dest: '.tmp/public/js/bundle.js',
      options: {
        watch : true, // use watchify for incremental builds!
        //  keepAlive : true, // watchify will exit unless task is kept alive
        //fullPaths: false,
        basedir: '/assets/js/react/',
        browserifyOptions: {
          debug: true, // source mapping
          extensions: ['.jsx', '.js']
        },
        transform: [
          ['babelify', {
            compact: false,
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-spread',
              '@babel/plugin-transform-runtime',
              'babel-plugin-styled-components'
            ],
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ],
          }],
          ['browserify-css', { global: true }]
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
};
