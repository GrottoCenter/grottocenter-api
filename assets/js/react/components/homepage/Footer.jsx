import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import DonateForm from './DonateForm';
import FooterDisclamer from '../common/FooterDisclamer';
import Publisher from './Publisher';
import SocialLinks from './SocialLinks';
import FooterLinks from './FooterLinks';
import {
  GridContainer,
  GridRow,
  GridOneHalfColumn,
} from '../../helpers/GridSystem';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FooterWrapper = withTheme(styled.div`
  background-color: ${(props) => props.theme.palette.primary1Color};
  color: ${(props) => props.theme.palette.textIconColor};
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
          <GridOneHalfColumn>
            <Publisher />
          </GridOneHalfColumn>

          <GridOneHalfColumn>
            <DonateForm />
          </GridOneHalfColumn>
        </GridRow>

        <Divider />

        <GridRow>
          <GridOneHalfColumn>
            <FooterLinks />
          </GridOneHalfColumn>

          <GridOneHalfColumn>
            <SocialLinks />
          </GridOneHalfColumn>
        </GridRow>
      </GridContainer>
    </FooterWrapper>

    <FooterDisclamer />
  </div>
);

export default Footer;
