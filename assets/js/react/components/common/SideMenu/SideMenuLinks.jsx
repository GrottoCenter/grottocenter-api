import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import Translate from '../Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const Icon = withTheme()(styled.img`
  width: 20px;
  margin-right: 5%;
`);

const SideMenuLi = styled.li`
  font-size: 15px;
  margin-bottom: 4%;
  padding: 6px 6px;
  padding-left: 5%;
  width: 85%;
  border-radius: 2px;
  :hover,
  :active {
    background-color: #f0ebeb;
    cursor: pointer;
  }
`;

const SideMenuList = styled.ul`
  margin-left: 10%;
  margin-top: 10%;
  list-style: none;
`;

const SideMenuA = styled.a`
  text-decoration: none;
  color: black;

  :hover,
  :active {
    text-decoration: none;
    color: black;
  }
`;

//
//
// M A I N - C O M P O N E N T
//
//

const SideMenuLinks = () => (
  <SideMenuList>
    <SideMenuA href="/">
      <SideMenuLi>
        <Icon src="/images/sidemenu/home.png" alt="home icon" />
        <Translate>Home page</Translate>
      </SideMenuLi>
    </SideMenuA>

    <SideMenuA hred="#">
      <SideMenuLi>
        <Icon src="/images/sidemenu/search.png" alt="search icon" />
        <Translate>Advanced search</Translate>
      </SideMenuLi>
    </SideMenuA>

    <SideMenuA href="/ui/map">
      <SideMenuLi>
        <Icon src="/images/sidemenu/loc.png" alt="map icon" />
        <Translate>Map</Translate>
      </SideMenuLi>
    </SideMenuA>

    <SideMenuA hred="#">
      <SideMenuLi>
        <Icon src="/images/sidemenu/wrench.png" alt="wrench icon" />
        <Translate>Toolbox</Translate>
      </SideMenuLi>
    </SideMenuA>
  </SideMenuList>
);

export default SideMenuLinks;
