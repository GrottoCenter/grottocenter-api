import React from 'react';
import GCMap from '../common/GCMap';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const BackgroundMap = (props) => (
  <FullPageGCMap {...props} />
);

const FullPageGCMap = styled(GCMap)`
  width: 100%;
  height: calc(100% - 128px);
  position: fixed;
`;

export default muiThemeable()(BackgroundMap);
