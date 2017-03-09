/**
 * TODO Add comment
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import I18n from 'react-ghost-i18n';

import LightPage from './pages/LightPage';
import StandardPage from './pages/StandardPage';
import HomepageFlat from './pages/HomepageFlat';
import Faq from './components/Faq';
import SigninForm from './components/SigninForm';
import SignupForm from './components/SignupForm';
import Map from './components/Map';

import grottoTheme from './grottoTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {searchReducers} from './reducers/SearchReducers';

// Needed for onTouchTap// sans ça les clicks de material-ui ne fonctionnent pas
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

let gcStore = createStore(searchReducers);

/*
  * please do not remove *
  localization init via ejs printed global var catalog
*/
I18n.locale = window.catalog;

ReactDOM.render(
  <MuiThemeProvider muiTheme={getMuiTheme(grottoTheme)}>
    <Provider store={gcStore}>
      <Router history={browserHistory}>
        <Route path="/map" component={Map}>
        </Route>
        <Route path="/auth/" component={LightPage}>
          <Route path="/auth/signin" component={SigninForm}/>
          <Route path="/auth/signup" component={SignupForm}/>
        </Route>
        <Route path="/" component={StandardPage}>
          <IndexRoute component={HomepageFlat}/>
          <Route path="/ui/faq" component={Faq}/>
        </Route>
      </Router>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('gc3_content_wrapper')
);
