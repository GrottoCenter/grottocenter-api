import { addDecorator } from '@storybook/react';
import { setIntlConfig, withIntl } from 'storybook-addon-intl';
import StoryRouter from 'storybook-react-router';
import { withKnobs } from '@storybook/addon-knobs';
import { keys } from 'ramda';

// Load the locale data for all your defined locales
import translations from '../config/locales';
import StylesDecorator from './styles-decorator';

const getMessages = (locale) => translations[locale];

// Set intl configuration
setIntlConfig({
  locales: keys(translations),
  defaultLocale: 'en',
  getMessages,
});

// Register decorator
addDecorator(withIntl);
addDecorator(StylesDecorator);
addDecorator(StoryRouter());
