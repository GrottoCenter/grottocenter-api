import React from 'react';
import ExploreIcon from '@material-ui/icons/Explore';
import { withStyles } from '@material-ui/core';

//
//
// H E L P E R - F U N C T I O N S
//
//

export const isMappable = entry => entry.latitude && entry.longitude;

const StyledExploreIcon = withStyles(theme => ({
  root: {
    fill: theme.palette.primary2Color,
    paddingRight: '10px',
  },
}), { withTheme: true })(ExploreIcon);

export const entryOptionForSelector = option => (
  <React.Fragment>
    <StyledExploreIcon />
    {option.label}
  </React.Fragment>
);
