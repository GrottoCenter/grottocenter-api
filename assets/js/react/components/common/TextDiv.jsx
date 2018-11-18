import React from 'react';
import PropTypes from 'prop-types';

//
//
// M A I N - C O M P O N E N T
//
//

const TextDiv = ({className, children}) => (
  <div className={className}>
    {children}
  </div>
);

TextDiv.propTypes = {
  children: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default TextDiv;
