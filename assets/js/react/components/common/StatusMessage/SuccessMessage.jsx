import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import StyledMessage from './style';

// ==========

const StyledSuccessMessage = styled(StyledMessage)`
  ${({ theme }) => `
    background-color: ${theme.palette.successColor};
  `}
`;

// ==========

const SuccessMessage = ({ children }) => (
  <StyledSuccessMessage>{children}</StyledSuccessMessage>
);

SuccessMessage.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SuccessMessage;
