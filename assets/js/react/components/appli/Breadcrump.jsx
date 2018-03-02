import React from 'react';
import I18n from 'react-ghost-i18n';
import GCLink from '../common/GCLink';
import ChevronIcon from 'material-ui/svg-icons/navigation/chevron-right';
import HomeIcon from 'material-ui/svg-icons/action/home';
import {breadcrumpKeys} from '../../conf/Config';
import muiThemeable from 'material-ui/styles/muiThemeable';

import styled from 'styled-components';

const BreadcrumpBar = muiThemeable()(styled.div`
  color: ${props => props.muiTheme.palette.fullBlack} !important;
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
  padding: 0px !important;
  height: 24px;
`);

const StyledLink = styled(GCLink)`
  text-decoration: none;
  position: relative;
  top: -7px;
  color: black;

  > span {
    font-size: small;
  }
`;

const StyledHomeIcon = styled(HomeIcon)`
  padding-right: 5px;
`;

const Breadcrump = () => {
  let path = window.location.pathname;
  let cutPath  = path.split('/');
  let breadcrump = [];
  cutPath.forEach((item) => {
    if (item.trim().length > 0) {
      if (breadcrump.length > 0) {
        breadcrump.push(<ChevronIcon key={'c'+item} />);
      }
      breadcrump.push(
        <StyledLink internal={true} href='/ui/' key={'l'+item}>
          <I18n>{breadcrumpKeys[item]}</I18n>
        </StyledLink>
      );
    }
  });
  return (
    <BreadcrumpBar>
      <StyledHomeIcon/>
      {breadcrump}
    </BreadcrumpBar>
  );
};

export default Breadcrump;
