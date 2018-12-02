import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import { RIGHT_TO_LEFT } from '../../conf/Config';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledIconSpan = withTheme()(styled.span`
  position: absolute;
  height: 72px;
  background-color: ${props => props.theme.palette.primary3Color};
`);

const StyledSearchIcon = withStyles(theme => ({
  root: {
    '&:hover': {
      fill: theme.palette.accent1Color,
    },
    height: '50px',
    width: '50px',
    paddingTop: 'calc((72px - 50px) / 2)',
    fill: theme.palette.primary1Color,
  },
}), { withTheme: true })(SearchIcon);

/*
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
*/

const StyledQuicksearchContainer = withStyles(theme => ({
  root: {
    marginRight: theme.direction === RIGHT_TO_LEFT ? '50px' : '0px',
    marginLeft: theme.direction === RIGHT_TO_LEFT ? '0px' : '50px',
  },
  input: {
    backgroundColor: theme.palette.primary3Color,
  },
}), { withTheme: true })(QuicksearchContainer);

//
//
// M A I N - C O M P O N E N T
//
//

const handleSelection = (selection, history) => {
  if (selection.id && !window.location.pathname.startsWith('/ui/map')) {
    history.push('/ui/map');
  }
};

const QuicksearchBar = props => (
  <React.Fragment>
    <StyledIconSpan>
      <StyledSearchIcon />
    </StyledIconSpan>
    <StyledQuicksearchContainer
      handleSelection={selection => handleSelection(selection, props.history)}
    />
  </React.Fragment>
);

QuicksearchBar.propTypes = {
  history: PropTypes.object.isRequired,
};

export default withRouter(QuicksearchBar);
