import React, {Component} from 'react';
import I18n from 'react-ghost-i18n';
import Welcome from '../components/homepage/Welcome';
import LatestNews from '../components/homepage/LatestNews';
import Association from '../components/homepage/Association';
import WhatIsIt from '../components/homepage/WhatIsIt';
import RandomEntry from '../components/homepage/RandomEntry';
import Partners from '../components/homepage/Partners';

class HomepageFlat extends Component {
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

export default HomepageFlat;
