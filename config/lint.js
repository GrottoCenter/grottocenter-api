module.exports.lint = {
  enabled: true, // Enable lint. Defaults to `true`
  format: 'stylish', // Formatter. Defaults to `stylish`
  // Folders or files to lint or be ignored, support glob patterns,
  // pattern that starts with '!' are ignored by linting.
  src: [
    '.',
    '!assets/swagger/**/*.js',
    '!tasks/**/*.js',
    '!Gruntfile.js',
    '!app.js',
    '!api/responses/**/*.js',
  ],
};
