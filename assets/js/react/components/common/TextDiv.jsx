import React, {PropTypes} from 'react';

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
