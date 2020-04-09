import { addDecorator, configure } from '@storybook/react';
import { setIntlConfig, withIntl } from 'storybook-addon-intl';
import StoryRouter from 'storybook-react-router';

// Load the locale data for all your defined locales
import { addLocaleData } from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import deLocaleData from 'react-intl/locale-data/de';
import translations from '../config/locales';
import StylesDecorator from './styles-decorator';

addLocaleData(enLocaleData);
addLocaleData(deLocaleData);

const getMessages = (locale) => translations[locale];

// Set intl configuration
setIntlConfig({
  locales: ['en', 'de', 'fr'],
  defaultLocale: 'en',
  getMessages,
});

// Register decorator
addDecorator(withIntl);
addDecorator(StylesDecorator);
addDecorator(StoryRouter());
// Run storybook
configure(require.context('../assets/js/react/', true, /^.*?\b_stories\b.*?\.js\b.*?$/), module);
