import React from 'react';
import PropTypes from 'prop-types';

//
//
// H E L P E R - F U N C T I O N S
//
//

// HOC that reinject current GC context to give access to it to components outside app
// (example: Leaflet popup)
const withContext = (WrappedComponent, context) => {
  class ContextProvider extends React.Component {
    getChildContext() {
      return context;
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  ContextProvider.childContextTypes = {};

  Object.keys(context).forEach((key) => {
    // eslint-disable-next-line react/forbid-prop-types
    ContextProvider.childContextTypes[key] = PropTypes.any.isRequired;
  });

  return ContextProvider;
};

export default withContext;
