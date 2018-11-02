import React from 'react';
import LandingSection from './LandingSection';
import {GridRow, GridOneHalfColumn} from '../common/Grid';
import Translate from '../common/Translate';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import GCLink from '../common/GCLink';
import DynamicNumberConnector from '../../containers/DynamicNumberConnector';

const SectionTitle = withTheme()(styled.h3`
  color: ${props => props.theme.palette.accent1Color};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;
`);

const NumberBlock = styled(GridOneHalfColumn)`
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

const BlockIcon = withTheme()(styled.span`
  margin-right: 10px;
  font-size: 4.2em;
  color: ${props => props.theme.palette.primary1Color};
  line-height: 1;

  :before {
    font-family: gc-icon !important;
    font-style: normal;
    font-weight: normal !important;
    vertical-align: top;
  }
`);

const NumberText = withTheme()(styled(DynamicNumberConnector)`
  color: ${props => props.theme.palette.primary1Color};
  font-weight: 400;
`);

const BigNumberText = styled(NumberText)`
  font-size: 2.7em;
`;

const WhatIsIt = () => (
  <LandingSection>
    <GridRow>
      <SectionTitle>
        <Translate>Grottocenter numbers</Translate>
        <span className="icon icon-gc-bat" style={{'verticalAlign': 'super'}}></span><br/>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <NumberBlock>
        <BlockIcon className="icon-gc-entries" />
        <BigNumberText numberType='publicEntries'/><br/>
        <Translate>caves are freely accessible from the following page (</Translate><NumberText numberType='entries'/> <Translate>by logging on</Translate> <GCLink href='http://www.grottocenter.org'>Grotto v2</GCLink>)
      </NumberBlock>
      <NumberBlock>
        <BlockIcon className="icon-gc-club" />
        <BigNumberText numberType='officialPartners'/><br/>
        <Translate>organizations who take part in the project by  funding, providing data,communicating on the interest and benefits of  cavers to share data</Translate>
      </NumberBlock>
    </GridRow>
    <GridRow>
      <NumberBlock>
        <BlockIcon className="icon-gc-speleo" />
        <BigNumberText numberType='cavers'/><br/>
        <Translate>cavers take part, day after day, in improving and expanding the database</Translate>
      </NumberBlock>
      <NumberBlock>
        <BlockIcon className="icon-gc-expe" />
        <BigNumberText numberType='partners'/><br/>
        <Translate>organizations are registered on the site</Translate>
      </NumberBlock>
    </GridRow>
  </LandingSection>
);

export default WhatIsIt;
