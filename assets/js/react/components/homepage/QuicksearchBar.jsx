import React from 'react';
import SearchIcon from 'material-ui/svg-icons/action/search';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import {directionManager, RIGHT_TO_LEFT} from './../../containers/TextDirectionProvider';
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

const DirQuicksearchContainer = directionManager()(muiThemeable()(styled(QuicksearchContainer)`
  margin-right: ${props => props.direction === RIGHT_TO_LEFT ? '50px' : '0px' };
  margin-left: ${props => props.direction === RIGHT_TO_LEFT ? '0px' : '50px' };
`));

const StyledQuicksearchContainer = muiThemeable()(styled(DirQuicksearchContainer)`
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
  width: calc(100% - 50px) !important;
  padding: 0px !important;

  > label {
    font-weight: 300;
    font-size: 25px;
    top: 25px;
    color: ${props => props.muiTheme.palette.primary1Color} !important;
  }

  hr {
    width: 99% !important;
  }
`);

const QuicksearchBar = () => (
  <div>
    <QuicksearchIcon>
      <SearchIconWrapper />
    </QuicksearchIcon>
    <StyledQuicksearchContainer />
  </div>
);

export default QuicksearchBar;
