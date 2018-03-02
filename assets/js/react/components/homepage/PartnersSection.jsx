import React from 'react';
import LandingSection from './LandingSection';
import {GridRow, GridFullColumn} from '../common/Grid';
import PartnersCarouselContainer from '../../containers/PartnersCarouselContainer';
import Translate from '../common/Translate';
import styled from 'styled-components';
import muiThemeable from 'material-ui/styles/muiThemeable';

const SectionTitle = muiThemeable()(styled.h3`
  color: ${props => props.muiTheme.palette.accent1Color};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;
`);

const PartnersSection = () => (
  <LandingSection>
    <GridRow>
      <SectionTitle>
        <Translate>Partners</Translate>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <GridFullColumn>
        <PartnersCarouselContainer />
      </GridFullColumn>
    </GridRow>
  </LandingSection>
);

export default PartnersSection;
