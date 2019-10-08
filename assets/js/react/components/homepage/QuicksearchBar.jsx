import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import AdvancedSearchContainer from '../../containers/AdvancedSearchContainer';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import Translate from '../common/Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledBarContainer = withTheme()(styled.div`
  background-color: ${props => props.theme.palette.primary3Color};
  display: flex;  
`);

const StyledIconSpan = withTheme()(styled.span`
  height: 72px;
  text-align: center;
`);

const StyledAdvancedSearchText = withTheme()(styled.span`
  bottom: 0;
  color: ${props => props.theme.palette.primary2Color};
  font-size: 1rem;
  left: 50%;
  position: absolute;
  transform: translate(-50%, 0);
  width: 100%;
`);

const StyledSearchIcon = withStyles(theme => ({
  root: {
    height: '50px',
    width: '50px',
    paddingTop: 'calc((72px - 50px) / 2)',
    fill: theme.palette.primary1Color,
  },
}), { withTheme: true })(SearchIcon);

const StyledChevronLeftIcon = withStyles(theme => ({
  root: {
    '&:hover': {
      fill: theme.palette.accent1Color,
      cursor: 'pointer',
    },
    height: '40px',
    width: '40px',
    paddingTop: 'calc((72px - 50px) / 2)',
    fill: theme.palette.primary1Color,
    transition: '0.5s',
  },
}), { withTheme: true })(ChevronLeftIcon);

const StyledAdvancedSearchBlock = withTheme()(styled.span`
  flex: 1;
  position: relative;
  text-align: center;
  &:hover {
    cursor: pointer;
  };
`);

const StyledQuicksearchContainer = withStyles(theme => ({
  root: {
    flex: 10,
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
class QuicksearchBar extends React.Component {
  state = {
    showAdvancedSearched: false,
  }

  handleSelection = (selection, history) => {
    if (selection.id) {
      if (selection.type === 'massif') {
        history.push(`/ui/massifs/${selection.id}`);
      } else if (!window.location.pathname.startsWith('/ui/map')) {
        history.push('/ui/map');
      }
    }
  };

  render() {
    const { history } = this.props;
    const { showAdvancedSearched } = this.state;

    return (
      <React.Fragment>
        <StyledBarContainer>
          <StyledIconSpan>
            <StyledSearchIcon />
          </StyledIconSpan>

          <StyledQuicksearchContainer
            handleSelection={selection => this.handleSelection(selection, history)}
          />

          <StyledAdvancedSearchBlock
            onClick={() => this.setState({
              showAdvancedSearched: !showAdvancedSearched,
            })}
          >
            <StyledIconSpan>
              <StyledChevronLeftIcon
                style={showAdvancedSearched ? {
                  paddingTop: 0,
                  paddingRight: 'calc((72px - 28px) / 2)',
                  transform: 'rotateZ(-90deg)',
                  transition: '0.5s',
                } : {}}
              />
            </StyledIconSpan>
            <StyledAdvancedSearchText>
              <Translate>Advanced search</Translate>
            </StyledAdvancedSearchText>
          </StyledAdvancedSearchBlock>

        </StyledBarContainer>

        <div
          style={showAdvancedSearched ? {
            height: 'auto',
            opacity: 1,
            transition: '0.7s ease-in',
          } : {
            height: 0,
            opacity: 0,
            transition: '0.7s ease-in',
          }}
        >
          <AdvancedSearchContainer />
        </div>

      </React.Fragment>
    );
  }
}

QuicksearchBar.propTypes = {
  history: PropTypes.shape({}).isRequired,
};
export default withRouter(QuicksearchBar);
