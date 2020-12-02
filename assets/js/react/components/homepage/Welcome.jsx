import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import LandingSection from './LandingSection';
import {
  GridRow,
  GridOneThirdColumn,
  GridTwoThirdColumn,
} from '../../helpers/GridSystem';
import Translate from '../common/Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const WelcomeAvatar = styled.img`
  border-radius: 50%;
  width: 60%;
  height: 60%;
`;

const WelcomeTitle = styled.h3`
  color: ${(props) => props.color};
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

//
//
// M A I N - C O M P O N E N T
//
//

const Welcome = ({ theme }) => (
  <WelcomeSection
    bgColor={theme.palette.primary1Color}
    fgColor={theme.palette.secondaryBlocTitle}
  >
    <GridRow>
      <GridOneThirdColumn>
        <WelcomeAvatar src="/images/caves/draperie_small.jpg" />
      </GridOneThirdColumn>

      <GridTwoThirdColumn>
        <WelcomeTitle color={theme.palette.accent1Color}>
          <Translate>Welcome to Grottocenter!</Translate>
        </WelcomeTitle>
        <WelcomeParagraph>
          <Translate
            id="This {0} version of the site is improving gradually to allow a simpler navigation from
            all your peripherals"
            values={{
              0: <span>3.4.9</span>,
            }}
          />
        </WelcomeParagraph>
        <WelcomeParagraph>
          <Translate>
            The application is faster, and benefits from a code of higher
            quality which is also easier to maintain: data processing specialist
            may join the development team and easily contribute.
          </Translate>
        </WelcomeParagraph>
        <WelcomeParagraph>
          <Translate>
            As of today, you can access updated information on caving, an
            effective module for quick search and quality information on caves.
            Regularly log in to discover new features and keep on using
            Grottocenter to take part and use information already added by the
            community.
          </Translate>
        </WelcomeParagraph>
      </GridTwoThirdColumn>
    </GridRow>
  </WelcomeSection>
);

Welcome.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  theme: PropTypes.any.isRequired,
};

export default withTheme(Welcome);
