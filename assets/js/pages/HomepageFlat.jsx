import React from 'react';
import I18n from 'react-ghost-i18n';
import Welcome from './homepage/Welcome';
import LatestNews from './homepage/LatestNews';
import Association from './homepage/Association';
import WhatIsIt from './homepage/WhatIsIt';
import RandomEntry from './homepage/RandomEntry';
import Partners from './homepage/Partners';

export default class HomepageFlat extends React.Component {
  constructor(props) {
    super(props);
    I18n.locale = catalog; //eslint-disable-line no-undef
  }
  
  render() {
    return (
      <div>
        <Welcome/>
        <WhatIsIt/>
        <RandomEntry/>
        <LatestNews/>
        <Association/>
        <Partners/>
      </div>
    );
  }
}
