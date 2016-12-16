import React from 'react';

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
