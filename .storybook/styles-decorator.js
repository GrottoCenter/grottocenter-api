import React from 'react';

import CssBaseline from '@material-ui/core/CssBaseline';
import { StylesProvider, MuiThemeProvider } from '@material-ui/core/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import MainTheme from '../assets/js/react/conf/grottoTheme';

const StylesDecorator = (storyFn) => (
  <StylesProvider injectFirst>
    <CssBaseline />
    <StyledThemeProvider theme={MainTheme}>
      <MuiThemeProvider theme={MainTheme}>{storyFn()}</MuiThemeProvider>
    </StyledThemeProvider>
  </StylesProvider>
);

export default StylesDecorator;
