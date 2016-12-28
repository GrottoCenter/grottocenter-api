import React from 'react';
import PropTypes from 'react/lib/ReactPropTypes';

import Header from './homepage/Header';
import Footer from './homepage/Footer';

export default class StandardPage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
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
