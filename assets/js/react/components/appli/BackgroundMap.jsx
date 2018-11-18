import React from 'react';
import GCMap from '../common/GCMap';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FullPageGCMap = styled(GCMap)`
  width: calc(100% - 40px);
  height: calc(100% - 173px);
  position: fixed;
`;

//
//
// M A I N - C O M P O N E N T
//
//

const BackgroundMap = (props) => (
  <FullPageGCMap {...props} />
);

export default withTheme()(BackgroundMap);
