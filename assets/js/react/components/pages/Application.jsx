import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import SideMenu from '../common/SideMenu/SideMenu';

import { Redirect, Route, Switch } from 'react-router-dom';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import BasePage from './BasePage';

import SideMenuConnector from '../../containers/SideMenuConnector';
import MassifContainer from '../../containers/MassifContainer';
import GroupContainer from '../../containers/GroupContainer';
import BbsContainer from '../../containers/BbsContainer';
import AppToolbarContainer from '../../containers/AppToolbarContainer';

import AppFooter from '../appli/AppFooter';
import Breadcrump from '../appli/Breadcrump';
import Api from '../appli/Api';
import Dashboard from '../appli/Dashboard';
import MapContainer from '../../containers/MapContainer';
import Swagger from './Swagger';
import Faq from '../appli/Faq';
import LatestBlogNewsSection from '../homepage/LatestBlogNewsSection';
import Entries from '../appli/entries/Index';
import Convert from '../common/map/Convert';


//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const ApplicationHeader = withTheme()(styled.header`
  background-color: ${props => props.theme.palette.secondary1Color};
`);

const AppFooterStl = styled(AppFooter)`
  /* position: fixed; */
  bottom: 0;
  width: 100%;
  padding: 0;
`;

const ArticleWrapper = styled.article`
  padding: 0px;
  margin: 20px;
`;


const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    marginLeft: drawerWidth,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  menuButton: {
    marginRight: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
  },
});



//
//
// M A I N - C O M P O N E N T
//
//

class Application extends React.Component {
  state = {
    mobileOpen: false,
  };

  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };

  render() {
    const { classes, theme } = this.props;

    // We get the current path to display the Breadcrump everywhere except on the Map
    const path = window.location.pathname;
    const cutPath = path.split('/');

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerToggle}
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>

            <ApplicationHeader><AppToolbarContainer /></ApplicationHeader>
            
          </Toolbar>
        </AppBar>
        <nav className={classes.drawer}>
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Hidden smUp implementation="css">
            <Drawer
              container={this.props.container}
              variant="temporary"
              anchor={theme.direction === 'rtl' ? 'right' : 'left'}
              open={this.state.mobileOpen}
              onClose={this.handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
            >
                <SideMenu />
            </Drawer>
          </Hidden>
          <Hidden xsDown implementation="css">
            <Drawer
              classes={{
                paper: classes.drawerPaper,
              }}
              variant="permanent"
              open
            >
                <SideMenu />
            </Drawer>
          </Hidden>
        </nav>
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <BasePage>
            <div id="applicationpage">
              <aside><SideMenuConnector /></aside>
              { (cutPath[2] !== 'map') && <Breadcrump /> }
              <ArticleWrapper>
                <Switch>
                  <Route exact path="/ui/" component={Dashboard} />
                  <Route path="/ui/api" component={Api} />
                  <Route path="/ui/entries" component={Entries} />
                  <Route path="/ui/faq" component={Faq} />
                  <Route path="/ui/testConvert" component={Convert} />
                  <Route path="/ui/map/:target?" component={MapContainer} />
                  <Route path="/ui/swagger/:version" component={Swagger} />
                  <Route path="/ui/test" component={LatestBlogNewsSection} />
                  <Route path="/ui/groups/:groupId" component={GroupContainer} />
                  <Route path="/ui/massifs/:massifId" component={MassifContainer} />
                  <Route path="/ui/bbs/:bbsId" component={BbsContainer} />
                  <Redirect path="/ui/*" to="/ui/" />
                </Switch>
              </ArticleWrapper>
              { !isMobileOnly && <footer><AppFooterStl /></footer> }
            </div>
          </BasePage>
        </main>
      </div>
    );
  }
}

Application.propTypes = {
  classes: PropTypes.object.isRequired,
  // Injected by the documentation to work in an iframe.
  // You won't need it on your project.
  container: PropTypes.object,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(Application);
