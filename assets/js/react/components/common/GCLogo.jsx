import React from 'react';
import PropTypes from 'prop-types';
import GCLink from './GCLink';
import {logoGC} from '../../conf/Config';

//
//
// M A I N - C O M P O N E N T
//
//

const GCLogo = ({className, showLink = true}) => {
  if (showLink) {
    return <GCLink blank={false} href='/' className={className}>
      <img src={logoGC} alt="GrottoCenter" />
    </GCLink>;
  }
  return <span className={className}>
    <img src={logoGC} alt="GrottoCenter" />
  </span>;
};

GCLogo.propTypes = {
  className: PropTypes.string,
  showLink: PropTypes.bool
};

export default GCLogo;
