import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import BasePage from './BasePage';
import SideMenuConnector from '../../containers/SideMenuConnector';
import AppToolbar from '../appli/AppToolbar';
import AppFooter from '../appli/AppFooter';
import Breadcrump from '../appli/Breadcrump';
import Api from '../appli/Api';
import Dashboard from '../appli/Dashboard';
import MapContainer from '../../containers/MapContainer';
import Swagger from './Swagger';
import Faq from '../appli/Faq';
import LatestBlogNewsSection from '../homepage/LatestBlogNewsSection';
import Entries from '../appli/entries/Index';
import MassifContainer from '../../containers/MassifContainer';
import GroupContainer from '../../containers/GroupContainer';
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
  margin-bottom: 65px;
`;

//
//
// M A I N - C O M P O N E N T
//
//

const Application = () => {
  // We get the current path to display the Breadcrump everywhere except on the Map
  const path = window.location.pathname;
  const cutPath = path.split('/');

  return (
    <BasePage>
      <div id="applicationpage">
        <ApplicationHeader><AppToolbar /></ApplicationHeader>
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
            <Redirect path="/ui/*" to="/ui/" />
          </Switch>

        </ArticleWrapper>
        <footer><AppFooterStl /></footer>
      </div>
    </BasePage>
  );
};

export default Application;
