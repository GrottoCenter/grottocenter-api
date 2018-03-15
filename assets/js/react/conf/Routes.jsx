import React from 'react';
import {Route, IndexRoute, Redirect} from 'react-router';

import BasePage from '../components/pages/BasePage';
import Landing from '../components/pages/Landing';
import Modal from '../components/pages/Modal';
import Application from '../components/pages/Application';
import Dashboard from '../components/appli/Dashboard';
import MapContainer from '../containers/MapContainer';
import Swagger from '../components/pages/Swagger';
import Faq from '../components/appli/Faq';
import SigninForm from '../components/SigninForm';
import SignupForm from '../components/SignupForm';
import AvailableTools, {EntriesOfInterest} from '../components/admin/Tools';
import Api from '../components/appli/Api';
import LatestBlogNewsSection from '../components/homepage/LatestBlogNewsSection';

export default (
  <Route>
    <Route path="/" component={BasePage}>
      <IndexRoute component={Landing}/>
      <Route path="ui" component={Application}>
        <IndexRoute component={Dashboard}/>
        <Route path="admin">
          <IndexRoute component={AvailableTools}/>
          <Route path="listEntriesOfInterest" component={EntriesOfInterest}/>
          <Route path="*" component={EntriesOfInterest}/>
        </Route>
        <Route path="api" component={Api}/>
        <Route path="auth" component={Modal}>
          <IndexRoute component={SigninForm}/>
          <Route path="signin" component={SigninForm}/>
          <Route path="signup" component={SignupForm}/>
          <Redirect from="*" to="/"/>
        </Route>
        <Route path="faq" component={Faq}/>
        <Route path="map(/:target)" component={MapContainer}/>
        <Route path="swagger" component={Swagger} />
        <Route path="test" component={LatestBlogNewsSection}/>
        <Redirect from="*" to="/"/>
      </Route>
    </Route>
  </Route>
);
