import React from 'react';
import I18n from 'react-ghost-i18n';

import Welcome from './homepage/Welcome';
import LatestNews from './homepage/LatestNews';
import Association from './homepage/Association';
import WhatIsIt from './homepage/WhatIsIt';
import RandomEntry from './homepage/RandomEntry';
import Partners from './homepage/Partners';
import RecentContributions from './homepage/RecentContributions';

export default class HomepageFlat extends React.Component {
  constructor(props) {
    super(props);
    I18n.locale = catalog;
  }
  render() {
    return (
      <div>
        <Welcome/>
        <LatestNews/>
        <Association/>
        <WhatIsIt/>
        <RandomEntry/>
        <Partners nbDisplayed="6"/>
        <RecentContributions/>
      </div>
    );
  }
}
