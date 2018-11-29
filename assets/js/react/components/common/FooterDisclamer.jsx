import React from 'react';
import PropTypes from 'prop-types';
import { withTheme } from '@material-ui/core/styles';
import Translate from '../common/Translate';
import InternationalizedLink from '../common/InternationalizedLink';
import {licenceLinks} from '../../conf/Config';
import styled from 'styled-components';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FooterBar = withTheme()(styled.div`
  color: ${props => props.theme.palette.fullBlack};
  background-color: ${props => props.theme.palette.primary3Color};
`);

// .fixFooter {
//   position: fixed;
//   bottom: 0;
//   width: 100%;
//   padding: 0;
// }

const DisclamerText = styled.p`
  text-align: center;
  margin-bottom: 0;
  font-size: 0.8em;
  font-weight: 300;
  padding: 5px;
`;

const LicenceLink = styled.p`
  text-align: center;
  margin: 0;
`;

const LicenceImage = styled.img`
  width: 100px;
`;

const FooterDisclamer = ({className}) => (
  <FooterBar className={className}>
    <DisclamerText>
      <Translate>Unless stated otherwise, all text and documents are available under the terms of the Creative Commons Attribution-ShareAlike 30 Unported</Translate>
    </DisclamerText>
    <LicenceLink>
      <InternationalizedLink links={licenceLinks}>
        <LicenceImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>
    </LicenceLink>
  </FooterBar>
);

FooterDisclamer.propTypes = {
  className: PropTypes.string
}
export default FooterDisclamer;
