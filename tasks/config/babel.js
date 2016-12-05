/**
 * Compile JSX files to JavaScript.
 *
 * ---------------------------------------------------------------
 *
 * Compiles jsx files from `assest/js` into Javascript and places them into
 * `.tmp/public/js` directory.
 *
 */
module.exports = function (grunt) {

    grunt.config.set('babel', {
        dev: {
            options: {
                sourceMap: true,
                presets: ['react', 'es2015']
            },
            files: [{
                expand: true,
                cwd: 'assets/js/',
                src: [
                    'actions/*.jsx',
                    'components/*.jsx',
                    'containers/*.jsx',
                    'pages/**/*.jsx',
                    'reducers/*.jsx',
                    'widgets/*.jsx'
                ],
                dest: '.tmp/public/js/',
                ext: '.js'
      }]
        }
    });

    grunt.loadNpmTasks('grunt-babel');
};
