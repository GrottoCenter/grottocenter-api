import React from 'react';

import I18n from './../components/I18n';
import GrottoAppBar from './homepage/GrottoAppBar';
import Header from './homepage/Header';
import Footer from './homepage/Footer';

const StandardPage = React.createClass({
  render: function() {
    return (
      <div>
        <GrottoAppBar/>
        <Header/>
        {this.props.children}
        <Footer/>
      </div>
    );
  }
});

export default StandardPage;
