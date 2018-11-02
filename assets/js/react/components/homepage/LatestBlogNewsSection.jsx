import React from 'react';
import LandingSection from './LandingSection';
import {GridRow, GridOneHalfColumn} from '../common/Grid';
import Translate from '../common/Translate';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import LatestBlogNews from '../../containers/LatestBlogNews';
import {FR_GC_BLOG, EN_GC_BLOG} from '../../conf/Config';

const SectionTitle = withTheme()(styled.h3`
  color: ${props => props.theme.palette.accent1Color};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;
`);

const LatestBlogNewsSection = () => (
  <LandingSection>
    <GridRow>
      <SectionTitle>
        <Translate>News</Translate>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <GridOneHalfColumn>
        <LatestBlogNews blog='fr' url={FR_GC_BLOG}/>
      </GridOneHalfColumn>
      <GridOneHalfColumn>
        <LatestBlogNews blog='en' url={EN_GC_BLOG}/>
      </GridOneHalfColumn>
    </GridRow>
  </LandingSection>
);

export default LatestBlogNewsSection;
