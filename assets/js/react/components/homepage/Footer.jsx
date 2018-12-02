import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import DonateForm from './DonateForm';
import FooterDisclamer from '../common/FooterDisclamer';
import Publisher from './Publisher';
import SocialLinks from './SocialLinks';
import FooterLinks from './FooterLinks';
import {
  GridContainer, GridRow, GridOneThirdColumn, GridFullColumn,
} from '../../helpers/GridSystem';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FooterWrapper = withTheme()(styled.div`
  background-color: ${props => props.theme.palette.primary1Color};
  color: ${props => props.theme.palette.textIconColor};
  font-size: smaller;
  padding: 15px;
  text-align: center;
`);

//
//
// M A I N - C O M P O N E N T
//
//
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
            <DonateForm />
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
