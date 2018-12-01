import React from 'react';
import ChevronIcon from '@material-ui/icons/ChevronRight';
import HomeIcon from '@material-ui/icons/Home';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import { breadcrumpKeys } from '../../conf/Config';
import GCLink from '../common/GCLink';
import Translate from '../common/Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const BreadcrumpBar = withTheme()(styled.div`
  color: ${props => props.theme.palette.primary1Color} !important;
  background-color: ${props => props.theme.palette.primary3Color} !important;
  padding: 0px !important;
  height: 24px;

  & > a, & > a:visited  {
    font-weight: 300;
    color: ${props => props.theme.palette.primary1Color} !important;

    :hover, :active {
      font-weight: 600;
    }
  }

  & > svg {
    color: ${props => props.theme.palette.primary1Color} !important;
  }
`);

const StyledLink = styled(GCLink)`
  text-decoration: none;
  position: relative;
  top: -7px;

  & > span {
    font-size: small;
  }
`;

const StyledHomeIcon = styled(HomeIcon)`
  padding-right: 5px;
`;

//
//
// M A I N - C O M P O N E N T
//
//

const Breadcrump = () => {
  const path = window.location.pathname;
  const cutPath = path.split('/');
  const breadcrump = [];
  cutPath.forEach((item) => {
    if (item.trim().length > 0) {
      if (breadcrump.length > 0) {
        breadcrump.push(<ChevronIcon key={`c${item}`} />);
      }
      if (breadcrumpKeys[item]) {
        breadcrump.push(
          <StyledLink internal href="/ui/" key={`l${item}`}>
            <Translate>{breadcrumpKeys[item]}</Translate>
          </StyledLink>,
        );
      }
    }
  });
  return (
    <BreadcrumpBar>
      <StyledHomeIcon />
      {breadcrump}
    </BreadcrumpBar>
  );
};

export default Breadcrump;
