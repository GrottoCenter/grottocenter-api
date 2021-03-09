import React from 'react';
import PropTypes from 'prop-types';
import StatusMessage from './index';

// ==========

const SuccessMessage = ({ message }) => (
  <StatusMessage message={message} severity="success" />
);

SuccessMessage.propTypes = {
  message: PropTypes.node.isRequired,
};

export default SuccessMessage;
