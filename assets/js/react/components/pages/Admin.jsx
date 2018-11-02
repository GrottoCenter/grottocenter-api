import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { withTheme } from '@material-ui/core/styles';
import styled from "styled-components";

import BasePage from './BasePage';
import SideMenuConnector from '../../containers/SideMenuConnector';
import AppToolbar from '../appli/AppToolbar';
import AppFooter from '../appli/AppFooter';
import Breadcrump from '../appli/Breadcrump';
import AvailableTools, { EntriesOfInterest } from '../../components/admin/Tools';


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
`;

const Admin = () => (
  <BasePage>
    <div id='adminpage'>
      <ApplicationHeader><AppToolbar /></ApplicationHeader>
      <aside><SideMenuConnector /></aside>
      <Breadcrump />
      <ArticleWrapper>
				<Switch>
					<Route exact path="/admin/" component={AvailableTools} />
					<Route path="/admin/listEntriesOfInterest" component={EntriesOfInterest} />
					<Route path="/admin/*" to="/admin/" />
				</Switch>
      </ArticleWrapper>
      <footer><AppFooterStl /></footer>
    </div>
  </BasePage>
);

export default Admin;
