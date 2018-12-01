import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { GridContainer } from '../../helpers/GridSystem';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const Section = ({ className, children }) => (
  <div role="section" className={className}>
    <GridContainer>
      {children}
    </GridContainer>
  </div>
);

Section.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any.isRequired,
};

//
//
// M A I N - C O M P O N E N T
//
//

const LandingSection = styled(Section)`
  clear: both;
  padding: 40px 0;
  background-color: ${props => props.bgColor};
  color: ${props => props.fgColor};
`;

export default LandingSection;
