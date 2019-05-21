import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import GCMap from '../common/GCMap';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FullPageGCMap = styled(GCMap)`
  width: calc(100% - 0px);
  height: ${isMobileOnly ? 'calc(100% - 60px)' : 'calc(100% - 110px)'};
  position: fixed;
  margin-left: -20px;
  margin-top: -20px;
`;

//
//
// M A I N - C O M P O N E N T
//
//

const BackgroundMap = props => (
  <FullPageGCMap {...props} />
);

export default withTheme()(BackgroundMap);
