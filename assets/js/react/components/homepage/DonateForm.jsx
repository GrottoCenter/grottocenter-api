import React from 'react';
import GiftIcon from 'material-ui/svg-icons/action/card-giftcard';
import FlatButton from 'material-ui/FlatButton';
import I18n from 'react-ghost-i18n';
import {paypalLink, paypalImgLink, paypalId} from '../../conf/Config';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled, {keyframes} from 'styled-components';

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

const DonateButton = muiThemeable()(styled(FlatButton)`
  background-color: ${props => props.muiTheme.palette.accent1Color} !important; // lesshint importantRule: false
  color: ${props => props.muiTheme.palette.textIconColor} !important; // lesshint importantRule: false
  height: auto !important; // lesshint importantRule: false

  &:hover {
    color: ${props => props.muiTheme.palette.primaryTextColor} !important; // lesshint importantRule: false

    svg {
      fill: ${props => props.muiTheme.palette.primaryTextColor} !important; // lesshint importantRule: false
    }
  }

  > div {
    text-align: center;
    white-space: nowrap;
  }

  span {
     text-transform: none !important; // lesshint importantRule: false
  }

  svg {
    fill: ${props => props.muiTheme.palette.textIconColor} !important; // lesshint importantRule: false
    width: 40px !important; // lesshint importantRule: false
    height: 40px !important; // lesshint importantRule: false
  }
`);

const DonateForm = () => (
  <DonateFormWrapper>
    <form name='donate' action={paypalLink} method="post" target="_blank">
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value={paypalId} />
      <DonateButton
        href="javascript:document.donate.submit()"
        label={<I18n>Donate now</I18n>}
        icon={<GiftIcon/>}
      />
      <img alt='' src={paypalImgLink} width='1' height='1' />
    </form>
  </DonateFormWrapper>
);

export default muiThemeable()(DonateForm);
