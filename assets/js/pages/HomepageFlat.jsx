import React from 'react';
import ReactDOM from 'react-dom';

import grottoTheme from './grottoTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import GrottoAppBar from './homepage/GrottoAppBar';
import Header from './homepage/Header';
import LatestNews from './homepage/LatestNews';
import Association from './homepage/Association';
import WhatIsIt from './homepage/WhatIsIt';
import RandomEntry from './homepage/RandomEntry';
import Partners from './homepage/Partners';
import RecentContributions from './homepage/RecentContributions';
import Footer from './homepage/Footer';

// Needed for onTouchTap// sans ça les clicks de material-ui ne fonctionnent pas
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

export default class App extends React.Component {

    render() {
        return (
           <MuiThemeProvider muiTheme={getMuiTheme(grottoTheme)}>
              <div>
                <GrottoAppBar/>
                <Header/>
                <LatestNews/>
                <Association/>
                <WhatIsIt/>
                <RandomEntry/>
                <Partners nbDisplayed="6"/>
                <RecentContributions/>
                <Footer/>
              </div>
          </MuiThemeProvider>
        );
    }
};

ReactDOM.render(
  <App />,
  document.getElementById('homepage_wrapper')
);
