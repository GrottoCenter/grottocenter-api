import React from 'react';
import PropTypes from 'prop-types';
import LandingSection from './LandingSection';
import {GridRow, GridOneThirdColumn, GridTwoThirdColumn} from '../common/Grid';
import Translate from '../common/Translate'
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

const WelcomeAvatar = styled.img`
  border-radius: 50%;
  width: 60%;
  height: 60%;
`;

const WelcomeTitle = styled.h3`
  color: ${props => props.color};
  padding-top: 30px;
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;

  @media (min-width: 550px) {
    padding-top: 0;
  }
`;

const WelcomeParagraph = styled.p`
  text-align: justify;
  font-weight: 300;
  font-size: large;
`;

const WelcomeSection = styled(LandingSection)`
  > div:first-child {
    text-align: center;
  }
`;

const Welcome = (props) => (
  <WelcomeSection
    bgColor={props.theme.palette.primary1Color}
    fgColor={props.theme.palette.secondaryBlocTitle}>
    <GridRow>
      <GridOneThirdColumn>
        <WelcomeAvatar src="/images/caves/draperie_small.jpg"/>
      </GridOneThirdColumn>

      <GridTwoThirdColumn>
        <WelcomeTitle color={props.theme.palette.accent1Color}>
          <Translate>Welcome to Grottocenter!</Translate>
        </WelcomeTitle>
        <WelcomeParagraph>
          <Translate>This 31 version of the site is  improving gradually to allow  a simpler navigation from all your peripherals</Translate>
        </WelcomeParagraph>
        <WelcomeParagraph>
          <Translate>The application is faster, and benefits  from a code of higher quality which is also easier to maintain: data processing specialist may join the development team and easily contribute</Translate>
        </WelcomeParagraph>
        <WelcomeParagraph>
          <Translate>As of today, you can access updated information on caving, an effective module for quick search and quality information on caves Regularly  log in to discover new features and keep on using Grottocenter to take part and use information already added by the community</Translate>
        </WelcomeParagraph>
      </GridTwoThirdColumn>
    </GridRow>
  </WelcomeSection>
);

Welcome.propTypes = {
  theme: PropTypes.any.isRequired
}

export default withTheme()(Welcome);
