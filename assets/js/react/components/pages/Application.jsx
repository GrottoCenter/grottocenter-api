import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

import BasePage from './BasePage';
import SideMenuConnector from '../../containers/SideMenuConnector';
import AppToolbar from '../appli/AppToolbar';
import AppFooter from '../appli/AppFooter';
import Breadcrump from '../appli/Breadcrump';
import Api from "../appli/Api";
import Dashboard from '../appli/Dashboard';
import MapContainer from '../../containers/MapContainer';
import Swagger from '../../components/pages/Swagger';
import Faq from '../../components/appli/Faq';
import LatestBlogNewsSection from '../../components/homepage/LatestBlogNewsSection';

const ApplicationHeader = muiThemeable()(styled.header`
  background-color: ${props => props.muiTheme.palette.secondary1Color};
`);

const AppFooterStl = styled(AppFooter)`
  /* position: fixed; */
  bottom: 0;
  width: 100%;
  padding: 0;
`;

const ArticleWrapper = styled.article`
  padding: 0px;
`;

const Application = () => (
  <BasePage>
    <div id='applicationpage'>
      <ApplicationHeader><AppToolbar /></ApplicationHeader>
      <aside><SideMenuConnector /></aside>
      <Breadcrump />
      <ArticleWrapper>
				<Switch>
					<Route exact path="/ui/" component={Dashboard} />
					<Route path="/ui/api" component={Api} />
					<Route path="/ui/faq" component={Faq} />
					<Route path="/ui/map/:target?" component={MapContainer} />
					<Route path="/ui/swagger" component={Swagger} />
					<Route path="/ui/test" component={LatestBlogNewsSection} />
					<Redirect path="/ui/*" to="/ui/" />
				</Switch>
      </ArticleWrapper>
      <footer><AppFooterStl /></footer>
    </div>
  </BasePage>
);

export default Application;
