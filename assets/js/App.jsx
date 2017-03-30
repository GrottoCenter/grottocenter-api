/**
 * TODO Add comment
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, browserHistory} from 'react-router';
import routes from './Routes';
import I18n from 'react-ghost-i18n';
import {FR_GC_BLOG, EN_GC_BLOG} from './Config';

import grottoTheme from './grottoTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';
import GCReducer from './reducers/GCReducer';

import {changeLanguage} from './actions/Language';
import {loadLatestBlogNews} from './actions/LatestBlogNews';
import TextDirectionProvider from './containers/TextDirectionProvider';

// Needed for onTouchTap// sans ça les clicks de material-ui ne fonctionnent pas
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

let gcStore = createStore(
  GCReducer,
  applyMiddleware(
    thunkMiddleware
  )
);

/*
  * please do not remove *
  localization init via ejs printed global var catalog
*/
I18n.locale = window.catalog;

// gcStore.subscribe(function() {
//   console.log(gcStore.getState());
// });

gcStore.dispatch(changeLanguage(locale)); //eslint-disable-line no-undef

/* Latest blog news */

gcStore.dispatch(loadLatestBlogNews('fr', FR_GC_BLOG)); //eslint-disable-line no-undef
gcStore.dispatch(loadLatestBlogNews('en', EN_GC_BLOG)); //eslint-disable-line no-undef

ReactDOM.render(
  <MuiThemeProvider muiTheme={getMuiTheme(grottoTheme)}>
    <Provider store={gcStore}>
      <TextDirectionProvider>
        <Router routes={routes} history={browserHistory} />
      </TextDirectionProvider>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('gc3_content_wrapper')
);
