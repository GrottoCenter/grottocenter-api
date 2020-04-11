/* eslint-disable no-underscore-dangle */

/**
 * TODO Add comment
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { addLocaleData, IntlProvider } from 'react-intl';
import localeData from 'react-intl/locale-data/index';
import createDebounce from 'redux-debounced';
import { Provider } from 'react-redux';
import ErrorBoundary from 'react-error-boundary';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { BrowserRouter } from 'react-router-dom';
import { MuiThemeProvider, createMuiTheme, StylesProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import grottoTheme from './conf/grottoTheme';
import GCReducer from './reducers/GCReducer';
import { changeLanguage } from './actions/Language';
import TextDirectionProvider from './containers/TextDirectionProvider';
import Application from './pages/Application';

addLocaleData(localeData);

const middlewares = applyMiddleware(createDebounce(), thunkMiddleware);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const gcStore = createStore(GCReducer, composeEnhancers(middlewares));

/* gcStore.subscribe(function() {
  console.log(gcStore.getState());
}); */

gcStore.dispatch(changeLanguage(locale)); // eslint-disable-line no-undef

const theme = createMuiTheme(grottoTheme);

ReactDOM.render(
  <IntlProvider locale={locale} messages={window.catalog}>
    <StylesProvider injectFirst>
      <CssBaseline />
      <StyledThemeProvider theme={theme}>
        <MuiThemeProvider theme={theme}>
          <Provider store={gcStore}>
            <TextDirectionProvider>
              <BrowserRouter>
                <div>
                  <ErrorBoundary>
                    <Application />
                  </ErrorBoundary>
                </div>
              </BrowserRouter>
            </TextDirectionProvider>
          </Provider>
        </MuiThemeProvider>
      </StyledThemeProvider>
    </StylesProvider>
  </IntlProvider>,
  document.getElementById('gc3_content_wrapper'),
);
