import React from 'react';
import DonateForm from './DonateForm';
import FooterDisclamer from '../common/FooterDisclamer';
import Publisher from './Publisher';
import SocialLinks from './SocialLinks';
import FooterLinks from './FooterLinks';
import {GridContainer, GridRow, GridOneThirdColumn, GridFullColumn} from '../common/Grid';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

// .fixFooter {
//   position: fixed;
//   bottom: 0;
//   width: 100%;
//   padding: 0;
// }

const FooterWrapper = muiThemeable()(styled.div`
  background-color: ${props => props.muiTheme.palette.primary1Color};
  color: ${props => props.muiTheme.palette.textIconColor};
  font-size: smaller;
  padding: 15px;
  text-align: center;
`);

const Footer = () => (
  <div>
    <FooterWrapper>
      <GridContainer>
        <GridRow>
          <GridOneThirdColumn>
            <Publisher />
          </GridOneThirdColumn>

          <GridOneThirdColumn>
            <FooterLinks />
          </GridOneThirdColumn>

          <GridOneThirdColumn>
            <DonateForm/>
          </GridOneThirdColumn>
        </GridRow>

        <GridRow>
          <GridFullColumn>
            <SocialLinks />
          </GridFullColumn>
        </GridRow>
      </GridContainer>
    </FooterWrapper>


    <FooterDisclamer />
  </div>
);

export default Footer;
