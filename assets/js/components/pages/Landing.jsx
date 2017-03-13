import React from 'react';
import Header from '../homepage/Header';
import Welcome from '../homepage/Welcome';
import LatestNews from '../homepage/LatestNews';
import Association from '../homepage/Association';
import WhatIsIt from '../homepage/WhatIsIt';
import RandomEntry from '../homepage/RandomEntry';
import Partners from '../homepage/Partners';
import Footer from '../homepage/Footer';

const Landing = () => (
  <div>
    <Header/>
    <Welcome/>
    <WhatIsIt/>
    <RandomEntry/>
    <LatestNews/>
    <Association/>
    <Partners/>
    <Footer/>
  </div>
);

export default Landing;
