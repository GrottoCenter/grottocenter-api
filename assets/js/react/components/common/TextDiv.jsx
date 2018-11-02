import React from 'react';
import PropTypes from 'prop-types';

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
