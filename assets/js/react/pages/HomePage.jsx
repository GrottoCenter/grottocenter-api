import React from 'react';

import Header from '../components/homepage/Header';
import Welcome from '../components/homepage/Welcome';
import LatestBlogNewsSection from '../components/homepage/LatestBlogNewsSection';
import Association from '../components/homepage/Association';
import WhatIsIt from '../components/homepage/WhatIsIt';
import RandomEntry from '../components/homepage/RandomEntry';
import PartnersSection from '../components/homepage/PartnersSection';
import Footer from '../components/homepage/Footer';

const HomePage = () => (
  <>
    <Header />
    <Welcome />
    <WhatIsIt />
    <RandomEntry />
    <LatestBlogNewsSection />
    <Association />
    <PartnersSection />
    <Footer />
  </>
);

export default HomePage;
