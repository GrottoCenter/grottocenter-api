module.exports = {
  stories: [
    '../assets/js/react/**/*.stories.js',
    '../assets/js/react/**/_stories.js',
  ],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-links',
    '@storybook/addon-viewport/register',
    'storybook-addon-intl/register',
  ],
};
