import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography/Typography';
import Button from '@material-ui/core/Button';
import { Share, Print, GpsFixed, Map, Create } from '@material-ui/icons/';
//import 'typeface-roboto';
import { isMobile } from 'react-device-detect';
import Translate from '../../common/Translate';

const ActionButton = withStyles(
  (theme) => ({
    root: {
      backgroundColor: '#E1DCDA',
      color: '#795548',
      height: 'auto',
      padding: '4px 10px',
      marginBottom: '10px',
      marginLeft: '5px',

      '&:hover': {
        backgroundColor: '#E1DCDA',
      },

      '&>div': {
        textAlign: 'center',
        whiteSpace: 'nowrap',
      },

      '& > span': {
        textTransform: 'none',
      },
    },
  }),
  { withTheme: true },
)(Button);

const EditButton = withStyles(
  (theme) => ({
    root: {
      float: 'right',
    },
  }),
  { withTheme: true },
)(ActionButton);

const StyledTypography = withStyles(
  (theme) => ({
    root: {
      fontSize: '12px',
      textAlign: 'center',
      color: '#795548',
      paddingLeft: '4px',
      textTransform: 'uppercase',
    },
  }),
  { withTheme: true },
)(Typography);

class ActionBar extends React.Component {
  render() {
    console.log(isMobile);
    if (isMobile) {
      return (
        <div>
          <ActionButton href="">
            <Share />
          </ActionButton>

          <ActionButton href="">
            <Print />
          </ActionButton>

          <ActionButton href="">
            <GpsFixed />
          </ActionButton>

          <ActionButton href="">
            <Map />
          </ActionButton>

          <EditButton>
            <Create />
            <StyledTypography component="span">
              <Translate id="Edit" />
            </StyledTypography>
          </EditButton>
        </div>
      );
    } else {
      return (
        <div>
          <ActionButton href="">
            <Share />
            <StyledTypography component="span">
              <Translate id="Share!" />
            </StyledTypography>
          </ActionButton>

          <ActionButton href="">
            <Print />
            <StyledTypography component="span">
              <Translate id="Print" />
            </StyledTypography>
          </ActionButton>

          <ActionButton href="">
            <GpsFixed />
            <StyledTypography component="span"> GeoHack</StyledTypography>
          </ActionButton>

          <ActionButton href="">
            <Map />
            <StyledTypography component="span"> OpenStreetMap</StyledTypography>
          </ActionButton>

          <EditButton>
            <Create />
            <StyledTypography component="span">
              <Translate id="Edit" />
            </StyledTypography>
          </EditButton>
        </div>
      );
    }
  }
}

export default ActionBar;
