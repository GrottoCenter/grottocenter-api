import React from 'react';
import PropTypes from 'prop-types';
import StatusMessage from './index';

// ==========

const ErrorMessage = ({ message }) => (
  <StatusMessage message={message} severity="error" />
);

ErrorMessage.propTypes = {
  message: PropTypes.node.isRequired,
};

export default ErrorMessage;
