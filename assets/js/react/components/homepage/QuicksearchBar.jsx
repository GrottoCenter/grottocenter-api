import React from 'react';
import SearchIcon from '@material-ui/icons/Search';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import {directionManager, RIGHT_TO_LEFT} from './../../containers/TextDirectionProvider';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

const QuicksearchIcon = withTheme()(styled.span`
  position: absolute;
  height: 72px;
  background-color: ${props => props.theme.palette.primary3Color};

  svg {
    height: 50px !important; // lesshint importantRule: false
    width: 50px !important; // lesshint importantRule: false
    padding-top: calc((72px - 50px) / 2);
  }
`);

const SearchIconWrapper = withTheme()(styled(SearchIcon)`
  fill: ${props => props.theme.palette.primary1Color} !important;

  :hover {
    fill: ${props => props.theme.palette.accent1Color} !important;
  }
`);

const DirQuicksearchContainer = directionManager()(withTheme()(styled(QuicksearchContainer)`
  margin-right: ${props => props.direction === RIGHT_TO_LEFT ? '50px' : '0px' };
  margin-left: ${props => props.direction === RIGHT_TO_LEFT ? '0px' : '50px' };
`));

const StyledQuicksearchContainer = withTheme()(styled(DirQuicksearchContainer)`
  background-color: ${props => props.theme.palette.primary3Color} !important;
  width: calc(100% - 50px) !important;
  padding: 0px !important;

  > label {
    font-weight: 300;
    font-size: 25px;
    top: 25px;
    color: ${props => props.theme.palette.primary1Color} !important;
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
