import React from 'react';
import PropTypes from 'prop-types';

//
//
// H E L P E R - F U N C T I O N S
//
//

export default function checkPermission(right) {
  // Control rights
  let granted = false;

  if (granted) {
    return (Component) => {
      const GrantedAccessComponent = (props) => {
        return <Component {...props} />;
      };

      GrantedAccessComponent.contextTypes = {
        direction: PropTypes.string.isRequired
      };
      return GrantedAccessComponent;
    };
  }

  return () => {
    const DeniedAccessComponent = () => {
      return <div />;
    };

    DeniedAccessComponent.contextTypes = {
    };

    return DeniedAccessComponent;
  };
}
