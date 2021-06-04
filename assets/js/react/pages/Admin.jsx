import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

import BasePage from './BasePage';
import SideMenuConnector from '../containers/SideMenuConnector';
import AppToolbar from '../components/appli/AppToolbar';
import AppFooter from '../components/appli/AppFooter';
import Breadcrump from '../components/appli/Breadcrump';
import AvailableTools, { EntriesOfInterest } from '../components/admin/Tools';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const ApplicationHeader = withTheme(styled.header`
  background-color: ${(props) => props.theme.palette.secondary1Color};
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

//
//
// M A I N - C O M P O N E N T
//
//

const Admin = () => (
  <BasePage>
    <div id="adminpage">
      <ApplicationHeader>
        <AppToolbar />
      </ApplicationHeader>
      <aside>
        <SideMenuConnector />
      </aside>
      <Breadcrump />
      <ArticleWrapper>
        <Switch>
          <Route exact path="/admin/" component={AvailableTools} />
          <Route
            path="/admin/listEntriesOfInterest"
            component={EntriesOfInterest}
          />
          <Route path="/admin/*" to="/admin/" />
        </Switch>
      </ArticleWrapper>
      <footer>
        <AppFooterStl />
      </footer>
    </div>
  </BasePage>
);

export default Admin;
