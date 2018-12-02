import React from 'react';
import GiftIcon from '@material-ui/icons/CardGiftcard';
import Button from '@material-ui/core/Button';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled, { keyframes } from 'styled-components';
import Typography from '@material-ui/core/Typography/Typography';
import Translate from '../common/Translate';
import { paypalLink, paypalImgLink, paypalId } from '../../conf/Config';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const btEyeCatcher = keyframes`
  {
    0.3% {
      padding-right: 10px;
      padding-left: 0px;
    }
    0.6% {
      padding-right: 0px;
      padding-left: 0px;
    }
    0.9% {
      padding-right: 0px;
      padding-left: 10px;
    }
    1.2% {
      padding-right: 0px;
      padding-left: 0px;
    }
    1.5% {
      padding-right: 5px;
      padding-left: 0px;
    }
    1.8% {
      padding-right: 0px;
      padding-left: 0px;
    }
    2.1% {
      padding-right: 0px;
      padding-left: 5px;
    }
    2.4% {
      padding-right: 0px;
      padding-left: 0px;
    }
    2.7% {
      padding-right: 5px;
      padding-left: 0px;
    }
    3% {
      padding-right: 0px;
      padding-left: 0px;
    }
  }
`;

const DonateFormWrapper = styled.div`
  float: left;
  animation: ${btEyeCatcher} 10s linear infinite;

  @media (max-width: 550px) {
    float: initial;
    max-width: 100%;
    line-height: 5em;
    overflow: hidden;
  }
`;

const DonateButton = withStyles(theme => ({
  root: {
    backgroundColor: theme.palette.accent1Color,
    color: theme.palette.textIconColor,
    height: 'auto',
    padding: '4px 10px',

    '&:hover': {
      backgroundColor: theme.palette.accent1Color,
    },

    '&>div': {
      textAlign: 'center',
      whiteSpace: 'nowrap',
    },

    '& > span': {
      textTransform: 'none',
    },
  },
}), { withTheme: true })(Button);

const StyledGiftIcon = withStyles(theme => ({
  root: {
    fill: theme.palette.textIconColor,
    width: '40px',
    height: '40px',
    marginRight: '10px',
  },
}), { withTheme: true })(GiftIcon);

const StyledTypography = withStyles(theme => ({
  root: {
    fontSize: '14px',
    textAlign: 'center',
    color: theme.palette.textIconColor,
  },
}), { withTheme: true })(Typography);

//
//
// M A I N - C O M P O N E N T
//
//

const DonateForm = () => (
  <DonateFormWrapper>
    <form name="donate" action={paypalLink} method="post" target="_blank">
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value={paypalId} />
      <DonateButton href="javascript:document.donate.submit()">
        <StyledGiftIcon />
        <StyledTypography component="span"><Translate id="Donate now" /></StyledTypography>
      </DonateButton>
      <img alt="" src={paypalImgLink} width="1" height="1" />
    </form>
  </DonateFormWrapper>
);

export default withTheme()(DonateForm);
