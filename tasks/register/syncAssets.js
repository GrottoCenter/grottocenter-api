module.exports = function (grunt) {
	grunt.registerTask('syncAssets', [
		'jst:dev',
		'less:dev',
		'sync:dev',
		'babel:dev',
		'coffee:dev'
	]);
};
