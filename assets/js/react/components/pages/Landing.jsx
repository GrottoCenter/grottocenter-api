import React from 'react';
import Header from '../homepage/Header';
import Welcome from '../homepage/Welcome';
import LatestBlogNewsSection from '../homepage/LatestBlogNewsSection';
import Association from '../homepage/Association';
import WhatIsIt from '../homepage/WhatIsIt';
import RandomEntry from '../homepage/RandomEntry';
import PartnersSection from '../homepage/PartnersSection';
import Footer from '../homepage/Footer';
import GrottoAppBar from '../common/GrottoAppBar';

const Landing = () => (
  <div id='landingpage'>
    <GrottoAppBar/>
    <Header/>
    <Welcome/>
    <WhatIsIt/>
    <RandomEntry/>
    <LatestBlogNewsSection/>
    <Association/>
    <PartnersSection/>
    <Footer/>
  </div>
);

export default Landing;
