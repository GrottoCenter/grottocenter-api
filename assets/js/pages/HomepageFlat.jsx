import React from 'react';
import I18n from 'react-ghost-i18n';

import LatestNews from './homepage/LatestNews';
import Association from './homepage/Association';
import WhatIsIt from './homepage/WhatIsIt';
import RandomEntry from './homepage/RandomEntry';
import Partners from './homepage/Partners';
import RecentContributions from './homepage/RecentContributions';

const HomepageFlat = () => (
  <div>
    <LatestNews/>
    <Association/>
    <WhatIsIt/>
    <RandomEntry/>
    <Partners nbDisplayed="6"/>
    <RecentContributions/>
  </div>
);

export default HomepageFlat;
