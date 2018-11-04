/**
 * TODO Add comment
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { addLocaleData, IntlProvider } from 'react-intl';
import localeData from "react-intl/locale-data/index";
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

// Needed for onTouchTap// sans ça les clicks de material-ui ne fonctionnent pas
import injectTapEventPlugin from 'react-tap-event-plugin';

import grottoTheme from './conf/grottoTheme';
import GCReducer from './reducers/GCReducer';
import {changeLanguage} from './actions/Language';
import TextDirectionProvider from './containers/TextDirectionProvider';
import Landing from "./components/pages/Landing";
import Application from "./components/pages/Application";
import Admin from "./components/pages/Admin";

addLocaleData(localeData);

injectTapEventPlugin();

let gcStore = createStore(
  GCReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  applyMiddleware(
    thunkMiddleware
  )
);

/*gcStore.subscribe(function() {
  console.log(gcStore.getState());
});*/

gcStore.dispatch(changeLanguage(locale)); //eslint-disable-line no-undef

ReactDOM.render(
  <IntlProvider locale={locale} messages={window.catalog}>
    <MuiThemeProvider muiTheme={getMuiTheme(grottoTheme)}>
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
  document.getElementById('gc3_content_wrapper')
);
