import React, {PropTypes} from 'react';
import GCLink from './GCLink';
import {logoGC} from '../../conf/Config';

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
