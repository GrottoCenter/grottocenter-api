import React from 'react';
import QuicksearchBar from './QuicksearchBar';
import GCLink from '../common/GCLink';
import {GridContainer, GridRow, GridFullColumn} from '../common/Grid';
import {fseLinks} from '../../conf/Config';
import InternationalizedLink from '../common/InternationalizedLink';
import Translate from '../common/Translate';
import styled from 'styled-components';

const HeaderGridContainer = styled(GridContainer)`
  width: 100%;
  max-width: 100%;
  padding: 0;
  background: url('/images/caves/topo.jpg') 0 center;
  background-repeat: no-repeat;
  background-size: 220%;
  background-position: top;

  @media (min-width: @mdMin) {
    background-size: 130%;
  }

  @media (min-width: 1000px) {
    background-size: 100%;
  }
`;

const BrandRow = styled(GridRow)`
  padding: 40px 40px;
  text-align: center;
`;

const Sitename = styled.h1`
  font-weight: 600;
  font-size: 55px;
  line-height: 1.2;
  letter-spacing: -2px;

  @media (min-width: 550px) {
    font-size: 3.5em;
  }
`;

const SiteLogo = styled.img`
  width: 140px;

  @media (min-width: 550px) {
    width: 160px;
  }
`;

const Slogan = styled.span`
  font-size: large;
  font-weight: 400;
`;

const FseInfos = styled.span`
  display: flex;
  font-size: normal;
  font-weight: 300;
  line-height: 40px;

  span:nth-of-type(2) {
    display: none;
  }

  @media (min-width: @mdMin) {
    display: flex;

    span:nth-of-type(2) {
      display: flex;
    }
  }
`;

const FseImage = styled.img`
  width: 40px;
  height: 40px;
  margin: 0 10px;
`;

const Header = () => (
  <header className="header">
    <HeaderGridContainer>
      <BrandRow>
        <GridFullColumn>
          <GCLink blank={false} href='' className="logo">
            <SiteLogo src="/images/logo.svg" alt="logo-wikicaves"/>
          </GCLink>
          <Sitename>Grottocenter</Sitename>
          <Slogan>
              <Translate>The Wiki database made by cavers for cavers</Translate>
          </Slogan>
        </GridFullColumn>
      </BrandRow>

      <GridRow>
        <GridFullColumn>
          <FseInfos>
            <InternationalizedLink links={fseLinks}>
              <FseImage src="/images/FSE.svg" alt="Logo FSE" />
            </InternationalizedLink>
            <Translate>Grottocenter is supported by the FSE</Translate>
          </FseInfos>
        </GridFullColumn>
      </GridRow>

      <GridRow>
        <GridFullColumn>
          <QuicksearchBar />
        </GridFullColumn>
      </GridRow>
    </HeaderGridContainer>
  </header>
);

export default Header;
