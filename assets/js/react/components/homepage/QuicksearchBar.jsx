import React from 'react';
import SearchIcon from 'material-ui/svg-icons/action/search';
import QuicksearContainer from '../../containers/QuicksearchContainer';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const QuicksearchIcon = muiThemeable()(styled.span`
  position: absolute;
  height: 72px;
  background-color: ${props => props.muiTheme.palette.primary3Color};

  svg {
    height: 50px !important; // lesshint importantRule: false
    width: 50px !important; // lesshint importantRule: false
    padding-top: calc((72px - 50px) / 2);
  }
`);

const SearchIconWrapper = muiThemeable()(styled(SearchIcon)`
  fill: ${props => props.muiTheme.palette.primary1Color} !important;

  :hover {
    fill: ${props => props.muiTheme.palette.accent1Color} !important;
  }
`);

const QuicksearchBar = () => (
  <div>
    <QuicksearchIcon>
      <SearchIconWrapper />
    </QuicksearchIcon>
    <QuicksearContainer />
  </div>
);

export default QuicksearchBar;
