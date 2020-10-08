import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import MapContainer from '../containers/MapContainer';

import Api from '../components/appli/Api';
import Dashboard from './Dashboard';
import Swagger from './Swagger';
import HomePage from './HomePage';
import Admin from './Admin';
import AdvancedSearchPage from './AdvancedSearchPage';
import Faq from '../components/appli/Faq';
import LatestBlogNewsSection from '../components/homepage/LatestBlogNewsSection';
import Layout from '../components/common/Layouts/Main';

import LoginDialog from '../features/Login';
import QuickSearch from '../features/QuickSearch';
import AppBar from '../features/AppBar';

import DocumentSubmission from './DocumentSubmission';
import EntryPage from './Entry';
import GroupPage from './Group';
import BbsPage from './Bbs';
import MassifPage from './Massif';
import CaveSystemPage from './CaveSystem';
import ManageUsers from './Admin/ManageUsers';

const Application = () => {
  const dispatch = useDispatch();
  const isSideMenuOpen = useSelector((state) => state.sideMenu.open);
  const toggleSideMenu = () => dispatch({ type: 'TOGGLE_SIDEMENU' });

  return (
    <Layout
      AppBar={() => (
        <AppBar
          isSideMenuOpen={isSideMenuOpen}
          toggleSideMenu={toggleSideMenu}
          HeaderQuickSearch={() => <QuickSearch hasFixWidth={false} />}
        />
      )}
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={toggleSideMenu}
      SideBarQuickSearch={() => <QuickSearch />}
    >
      <LoginDialog />
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/admin" component={Admin} />
        <Route exact path="/ui" component={Dashboard} />
        <Route path="/ui/admin/users" component={ManageUsers} />
        <Route path="/ui/search" component={AdvancedSearchPage} />
        <Route path="/ui/api" component={Api} />
        <Route path="/ui/entries/:id?" component={EntryPage} />
        <Route path="/ui/caves/:id?" component={CaveSystemPage} />
        <Route path="/ui/faq" component={Faq} />
        <Route path="/ui/map/:target?" component={MapContainer} />
        <Route path="/ui/swagger/:version" component={Swagger} />
        <Route path="/ui/test" component={LatestBlogNewsSection} />
        <Route path="/ui/groups/:groupId" component={GroupPage} />
        <Route path="/ui/massifs/:massifId" component={MassifPage} />
        <Route path="/ui/bbs/:bbsId" component={BbsPage} />
        <Route path="/ui/login" component={HomePage} />
        <Route path="/ui/documents/add" component={DocumentSubmission} />
        <Redirect path="/ui/*" to="/ui" />
      </Switch>
    </Layout>
  );
};

export default Application;
