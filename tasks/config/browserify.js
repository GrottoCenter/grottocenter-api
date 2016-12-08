module.exports = function (grunt) {

    grunt.config.set('browserify', {
        dev: {
            files: {
                '.tmp/public/js/bundle.js': [
            '.tmp/public/js/actions/*.js',
            '.tmp/public/js/components/**/*.js',
            '.tmp/public/js/pages/**/*.js',
            '.tmp/public/js/reducers/*.js',
            '.tmp/public/js/widgets/*.js'
        ],
            },
            options: {
                transform: ['babelify']
            }
        },
        dist: {

        }
    });

    grunt.loadNpmTasks('grunt-browserify');
};
