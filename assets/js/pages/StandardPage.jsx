import React from 'react';
import PropTypes from 'react/lib/ReactPropTypes';

import GrottoAppBar from '../components/homepage/GrottoAppBar';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';

export default class StandardPage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <GrottoAppBar/>
        <Header/>
        {this.props.children}
        <Footer/>
      </div>
    );
  }
}

StandardPage.propTypes = {
  children: PropTypes.node.isRequired
};
