import React from 'react';
import PropTypes from 'prop-types';

//
//
// H E L P E R - F U N C T I O N S
//
//

export default function checkPermission(right) {
  // Control rights
  const granted = false;
  console.debug('Under development', right);

  if (granted) {
    return (Component) => {
      const GrantedAccessComponent = (props) => <Component {...props} />;

      GrantedAccessComponent.contextTypes = {
        direction: PropTypes.string.isRequired,
      };
      return GrantedAccessComponent;
    };
  }

  return () => {
    const DeniedAccessComponent = () => <div />;

    DeniedAccessComponent.contextTypes = {};

    return DeniedAccessComponent;
  };
}
