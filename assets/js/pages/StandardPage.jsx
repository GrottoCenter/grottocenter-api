import React from 'react';
import PropTypes from 'react/lib/ReactPropTypes';

import GrottoAppBar from '../components/homepage/GrottoAppBar';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';
import {directionManager, RIGHT_TO_LEFT} from './../containers/TextDirectionProvider';

const StandardPage = (props) => (
  <div style={{direction: (props.direction === RIGHT_TO_LEFT ? 'rtl' : 'ltr')}}>
    <GrottoAppBar/>
    <Header/>
    {props.children}
    <Footer/>
  </div>
);

StandardPage.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.string.isRequired
};

export default directionManager()(StandardPage);
