import React from 'react';
import {Route, IndexRoute} from 'react-router';

import LightPage from './pages/LightPage';
import StandardPage from './pages/StandardPage';
import HomepageFlat from './pages/HomepageFlat';
import PageNotFound from './pages/PageNotFound';

import Faq from './components/Faq';
import SigninForm from './components/SigninForm';
import SignupForm from './components/SignupForm';
import AvailableTools, {EntriesOfInterest} from './components/admin/Tools';

export default (
  <Route>
    <Route path="/admin" component={LightPage}>
      <IndexRoute component={AvailableTools}/>
      <Route path="/admin/listEntriesOfInterest" component={EntriesOfInterest}/>

      <Route path="*" component={PageNotFound}/>
    </Route>

    <Route path="/auth" component={LightPage}>
      <Route path="/auth/signin" component={SigninForm}/>
      <Route path="/auth/signup" component={SignupForm}/>

      <Route path="*" component={PageNotFound}/>
    </Route>

    <Route path="/" component={StandardPage}>
      <IndexRoute component={HomepageFlat}/>
      <Route path="/ui/faq" component={Faq}/>

      <Route path="*" component={PageNotFound}/>
    </Route>
  </Route>
);
