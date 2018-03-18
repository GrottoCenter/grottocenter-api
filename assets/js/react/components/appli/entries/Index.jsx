import React from 'react';
import {Route, Switch} from "react-router-dom";
import EntryAdd from "./Add";
import EntrySearch from "./Search";
import EntryDetails from "./Details";

const Index = () => (
  <div>
    Section des entrées
    <Switch>
      <Route path="/ui/**/entries/add" component={EntryAdd} />
      <Route path="/ui/**/entries/search" component={EntrySearch} />
      <Route path="/ui/**/entries/:id?" component={EntryDetails} />
    </Switch>
  </div>
);

export default Index;
