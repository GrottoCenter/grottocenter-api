import React from 'react';
import {Route, IndexRoute, Redirect, IndexRedirect} from 'react-router';

import BasePage from '../components/pages/BasePage';
import Landing from '../components/pages/Landing';
import Modal from '../components/pages/Modal';
import Swagger from '../components/pages/Swagger';
import Backend from '../components/pages/Backend';

import Caver from '../components/Caver';
import Contact from '../components/Contact';
import Entry from '../components/Entry';
import Faq from '../components/Faq';
import SigninForm from '../components/SigninForm';
import SignupForm from '../components/SignupForm';
import AvailableTools, {EntriesOfInterest} from '../components/admin/Tools';
import Api from '../components/Api';

import LatestBlogNewsSection from '../components/homepage/LatestBlogNewsSection';

export default (
  <Route>
    <Route path="/" component={BasePage}>
      <IndexRoute component={Landing}/>
      <Route path="ui">
        <IndexRoute component={Backend}/>
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
        <Route path="caver" component={Caver}/>
        <Route path="contact" component={Contact}/>
        <Route path="entry" component={Entry}/>
        <Route path="faq" component={Faq}/>
        <Route path="swagger" component={Swagger} />
        <Route path="test" component={LatestBlogNewsSection}/>
        <Redirect from="*" to="/"/>
      </Route>
    </Route>
  </Route>
);
