import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import LandingSection from './LandingSection';
import {
  GridRow,
  GridOneHalfColumn,
  GridFullColumn,
} from '../../helpers/GridSystem';
import Translate from '../common/Translate';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import { wikiBBSLinks } from '../../conf/Config';
import DynamicNumberConnector from '../../containers/DynamicNumberConnector';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const SectionTitle = withTheme(styled.h3`
  color: ${(props) => props.theme.palette.accent1Color};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;
`);

const NumberBlockHalfWidth = styled(GridOneHalfColumn)`
  font-weight: 300;
  font-size: large;
  text-align: center;
  padding-bottom: 40px;

  @media (min-width: 550px) {
    text-align: justify;
  }

  @media (max-width: 550px) {
    :last-child {
      margin-bottom: 0px;
    }
  }
`;

const NumberBlockFullWidth = styled(GridFullColumn)`
  font-weight: 300;
  font-size: large;
  text-align: center;
  padding-bottom: 40px;

  @media (max-width: 550px) {
    :last-child {
      margin-bottom: 0px;
    }
  }
`;

const BlockIcon = withTheme(styled.span`
  margin-right: 10px;
  font-size: 4.2em;
  color: ${(props) => props.theme.palette.primary1Color};
  line-height: 1;

  :before {
    font-family: gc-icon !important;
    font-style: normal;
    font-weight: normal !important;
    vertical-align: top;
  }
`);

const BbsIcon = styled.img`
  margin-right: 10px;
  width: 76px;
`;

const NumberText = withTheme(styled(DynamicNumberConnector)`
  color: ${(props) => props.theme.palette.primary1Color};
  font-weight: 400;
`);

const BigNumberText = withTheme(styled(NumberText)`
  font-size: 2.7em;
`);

//
//
// M A I N - C O M P O N E N T
//
//

const WhatIsIt = () => (
  <LandingSection>
    <GridRow>
      <SectionTitle>
        <Translate>Grottocenter numbers</Translate>
        <span className="icon icon-gc-bat" style={{ verticalAlign: 'super' }} />
        <br />
      </SectionTitle>
    </GridRow>
    <GridRow>
      <NumberBlockHalfWidth>
        <BlockIcon className="icon-gc-entries" />
        <BigNumberText numberType="publicEntrances" />
        <br />
        <Translate>
          caves are freely accessible from the following page (
        </Translate>
        <NumberText numberType="entrances" />{' '}
        <Translate>by logging on</Translate>{' '}
        <GCLink href="http://www.grottocenter.org">Grotto v2</GCLink>)
      </NumberBlockHalfWidth>
      <NumberBlockHalfWidth>
        <BlockIcon className="icon-gc-club" />
        <BigNumberText numberType="officialPartners" />
        <br />
        <Translate>
          organizations who take part in the project by funding, providing data,
          communicating on the interest and benefits of cavers to share data.
        </Translate>
      </NumberBlockHalfWidth>
    </GridRow>
    <GridRow>
      <NumberBlockHalfWidth>
        <BlockIcon className="icon-gc-speleo" />
        <BigNumberText numberType="users" />
        <br />
        <Translate>
          cavers take part, day after day, in improving and expanding the
          database
        </Translate>
      </NumberBlockHalfWidth>
      <NumberBlockHalfWidth>
        <BlockIcon className="icon-gc-expe" />
        <BigNumberText numberType="organizations" />
        <br />
        <Translate>organizations are registered on the site</Translate>
      </NumberBlockHalfWidth>
    </GridRow>
    <GridRow>
      <NumberBlockFullWidth>
        <BbsIcon src="/images/bbs_logo.png" alt="BBS logo" />
        <BigNumberText numberType="documents" />
        <br />
        <InternationalizedLink links={wikiBBSLinks}>
          <Translate>documents are referenced</Translate>
        </InternationalizedLink>
      </NumberBlockFullWidth>
    </GridRow>
  </LandingSection>
);

export default WhatIsIt;
