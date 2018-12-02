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
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import grottoTheme from './conf/grottoTheme';
import GCReducer from './reducers/GCReducer';
import { changeLanguage } from './actions/Language';
import TextDirectionProvider from './containers/TextDirectionProvider';
import Landing from './components/pages/Landing';
import Application from './components/pages/Application';
import Admin from './components/pages/Admin';

addLocaleData(localeData);

const gcStore = createStore(
  GCReducer,
  compose(
    applyMiddleware(createDebounce(), thunkMiddleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
);

/* gcStore.subscribe(function() {
  console.log(gcStore.getState());
}); */

gcStore.dispatch(changeLanguage(locale)); // eslint-disable-line no-undef

const theme = createMuiTheme(grottoTheme);

ReactDOM.render(
  <IntlProvider locale={locale} messages={window.catalog}>
    <MuiThemeProvider theme={theme}>
      <Provider store={gcStore}>
        <TextDirectionProvider>
          <BrowserRouter>
            <div>
              <Switch>
                <Route exact path="/" component={Landing} />
                <Route path="/admin" component={Admin} />
                <Route path="/ui" component={Application} />
              </Switch>
            </div>
          </BrowserRouter>
        </TextDirectionProvider>
      </Provider>
    </MuiThemeProvider>
  </IntlProvider>,
  document.getElementById('gc3_content_wrapper'),
);
