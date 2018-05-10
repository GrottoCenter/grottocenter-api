import React, {PropTypes} from 'react';

function checkPermission(right) {
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

export default checkPermission;
