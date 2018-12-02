import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore.string';

//
//
// H E L P E R - F U N C T I O N S
//
//
/* Encapsulate the grid mecanism in React components */

export const GridContainer = ({ className, children }) => (
  <div className={_.join(' ', 'container', className)}>
    {children}
  </div>
);

GridContainer.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
};

export const GridRow = ({ className, children }) => (
  <div className={_.join(' ', 'row', className)}>
    {children}
  </div>
);

GridRow.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
};

export const GridOneThirdColumn = ({ className, children }) => (
  <div className={_.join(' ', 'four columns', className)}>
    {children}
  </div>
);

GridOneThirdColumn.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
};

export const GridTwoThirdColumn = ({ className, children }) => (
  <div className={_.join(' ', 'eight columns', className)}>
    {children}
  </div>
);

GridTwoThirdColumn.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
};

export const GridOneHalfColumn = ({ className, children }) => (
  <div className={_.join(' ', 'six columns', className)}>
    {children}
  </div>
);

GridOneHalfColumn.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
};

export const GridFullColumn = ({ className, children }) => (
  <div className={_.join(' ', 'twelve columns', className)}>
    {children}
  </div>
);

GridFullColumn.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
};
