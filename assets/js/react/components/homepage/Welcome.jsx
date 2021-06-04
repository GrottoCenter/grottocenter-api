import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
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

const Welcome = ({ theme }) => {
  const { formatMessage } = useIntl();
  return (
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
            <Translate>Grottocenter 3 is totally evolving!</Translate>
          </WelcomeParagraph>
          <WelcomeParagraph>
            {formatMessage({
              id:
                'This newer, faster and more up-to-date version of the site also aims to provide you with new functions. Some are already up and running: a fast and efficient search module, suggestions for document analyzes to people connected to their account, etc.',
            })}
          </WelcomeParagraph>
          <WelcomeParagraph>
            {formatMessage({
              id:
                'Many more features are still in the works and we aim to get Grottocenter 3 fully operational in the coming months.',
            })}
            &nbsp;
            {formatMessage({
              id: 'In order to be able to do this, we need your help.',
            })}
            &nbsp;
            {formatMessage(
              {
                id:
                  'Therefore, for a few weeks, you will have the opportunity to respond to our <fundRaisingOperationUrl>fund-raising operation</fundRaisingOperationUrl>.',
                defaultMessage:
                  'Therefore, for a few weeks, you will have the opportunity to respond to our <fundRaisingOperationUrl>fund-raising operation</fundRaisingOperationUrl>.',
              },
              {
                fundRaisingOperationUrl: (text) => (
                  <a href="https://www.kisskissbankbank.com/en/projects/grottocenter-v3">
                    {text}
                  </a>
                ),
              },
            )}
            &nbsp;
            {formatMessage({
              id:
                'Every contribution is important and to thank you, we will offer you some nice little rewards.',
            })}
          </WelcomeParagraph>
          <WelcomeParagraph>
            <b>
              {formatMessage({
                id: 'PLEASE NOTE:',
              })}
            </b>
            &nbsp;
            {formatMessage({
              id:
                'for a few weeks (during the database switching), you will not be able to add or edit the Grottocenter cave files. This maintenance delay is unfortunately necessary, we apologize for the inconvenience. We will inform you here as soon as the functions for editing cave files are available again.',
            })}
          </WelcomeParagraph>
        </GridTwoThirdColumn>
      </GridRow>
    </WelcomeSection>
  );
};

Welcome.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  theme: PropTypes.shape({
    palette: PropTypes.shape({
      secondaryBlocTitle: PropTypes.string,
      primary1Color: PropTypes.string,
      accent1Color: PropTypes.string,
    }),
  }).isRequired,
};

export default withTheme(Welcome);
