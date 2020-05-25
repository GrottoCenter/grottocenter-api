import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import MassifContainer from '../containers/MassifContainer';
import GroupContainer from '../containers/GroupContainer';
import BbsContainer from '../containers/BbsContainer';
import Api from '../components/appli/Api';
import Dashboard from '../components/appli/Dashboard';
import MapContainer from '../containers/MapContainer';
import Swagger from './Swagger';
import HomePage from './HomePage';
import Admin from './Admin';
import AdvancedSearchPage from './AdvancedSearchPage';
import Faq from '../components/appli/Faq';
import LatestBlogNewsSection from '../components/homepage/LatestBlogNewsSection';
import Convert from '../components/common/Maps/main/Convert';
import Layout from '../components/common/Layouts/Main';
import QuickSearch from '../features/QuickSearch';
import EntryPage from './Entry';

const Application = () => {
  const dispatch = useDispatch();
  const isSideMenuOpen = useSelector((state) => state.sideMenu.open);

  return (
    <Layout
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={() => dispatch({ type: 'TOGGLE_SIDEMENU' })}
      SideBarQuickSearch={() => <QuickSearch />}
      HeaderQuickSearch={() => <QuickSearch hasFixWidth={false} />}
    >
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/admin" component={Admin} />
        <Route exact path="/ui/" component={Dashboard} />
        <Route path="/ui/search" component={AdvancedSearchPage} />
        <Route path="/ui/api" component={Api} />
        <Route path="/ui/entries/:id?" component={EntryPage} />
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
    </Layout>
  );
};

export default Application;
