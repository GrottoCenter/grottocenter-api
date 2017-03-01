import React from 'react';
import PropTypes from 'react/lib/ReactPropTypes';

import GrottoAppBar from '../components/homepage/GrottoAppBar';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';

const StandardPage = (props) => (
  <div>
    <GrottoAppBar/>
    <Header/>
    {props.children}
    <Footer/>
  </div>
);

StandardPage.propTypes = {
  children: PropTypes.node.isRequired
};

export default StandardPage;
