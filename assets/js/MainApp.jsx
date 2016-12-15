/**
 * TODO Add comment
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

import LightPage from './pages/LightPage';
import StandardPage from './pages/StandardPage';
import HomepageFlat from './pages/HomepageFlat';
import SigninForm from './components/SigninForm';
import SignupForm from './components/SignupForm';
import FilterableProductTable from './widgets/EntryList';

import grottoTheme from './pages/grottoTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { searchReducers } from './reducers/SearchReducers'

// Needed for onTouchTap// sans ça les clicks de material-ui ne fonctionnent pas
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

let gcStore = createStore(searchReducers);

ReactDOM.render(
  <MuiThemeProvider muiTheme={getMuiTheme(grottoTheme)}>
    <Provider store={gcStore}>
      <Router history={createBrowserHistory()}>
        <Route path="/auth/" component={LightPage}>
          <Route path="/auth/signin" component={SigninForm}/>
          <Route path="/auth/signup" component={SignupForm}/>
        </Route>
        <Route path="/" component={StandardPage}>
          <IndexRoute component={HomepageFlat}/>
          <Route path="/ui/cavelist" component={FilterableProductTable}/>
        </Route>
      </Router>
    </Provider>
  </MuiThemeProvider>,
  document.getElementById('gc3_content_wrapper')
);
