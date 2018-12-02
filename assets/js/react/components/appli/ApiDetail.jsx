import React from 'react';
// import SwaggerUi, {presets} from 'swagger-ui';
import Card from '@material-ui/core/Card';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledWrapper = withTheme()(styled.div`
  color: ${props => props.theme.palette.textIconColor};
`);

const StyledCard = withStyles({
  root: {
    width: '80%',
    margin: 'auto',
    paddingRight: '40px',
    paddingBottom: '20px',
  },
})(Card);

//
//
// M A I N - C O M P O N E N T
//
//

const ApiDetail = () => (
  <StyledWrapper>
    <StyledCard>
      <div id="swaggerContainer" />
    </StyledCard>
  </StyledWrapper>
);
export default ApiDetail;
