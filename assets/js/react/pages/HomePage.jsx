import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { displayLoginDialog } from '../actions/Auth';

import Header from '../components/homepage/Header';
import Welcome from '../components/homepage/Welcome';
import LatestBlogNewsSection from '../components/homepage/LatestBlogNewsSection';
import Association from '../components/homepage/Association';
import WhatIsIt from '../components/homepage/WhatIsIt';
import RandomEntry from '../components/homepage/RandomEntry';
import PartnersSection from '../components/homepage/PartnersSection';
import Footer from '../components/homepage/Footer';

import { isAuth } from '../helpers/AuthHelper';

const HomePage = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  if (
    !isAuth() &&
    (location.pathname === '/ui/login' || location.pathname === '/ui/login/')
  ) {
    dispatch(displayLoginDialog());
  }

  return (
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
};

export default HomePage;
