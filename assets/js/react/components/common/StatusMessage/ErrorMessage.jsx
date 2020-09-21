import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import StyledMessage from './style';

// ==========

const StyledErrorMessage = styled(StyledMessage)`
  ${({ theme }) => `
    background-color: ${theme.palette.errorColor};
  `}
`;

// ==========

const ErrorMessage = ({ children }) => (
  <StyledErrorMessage>{children}</StyledErrorMessage>
);

ErrorMessage.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorMessage;
