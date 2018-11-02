import React from 'react';
import PropTypes from 'prop-types';
import {GridContainer} from '../common/Grid';
import styled from 'styled-components';

const Section = ({className, children}) => (
  <div role="section" className={className}>
    <GridContainer>
      {children}
    </GridContainer>
  </div>
);

Section.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any.isRequired
};

const LandingSection = styled(Section)`
  clear: both;
  padding: 40px 0;
  background-color: ${props => props.bgColor};
  color: ${props => props.fgColor};
`;

export default LandingSection;
