import React from 'react';
import PropTypes from 'prop-types';

import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';

import { Button, CardActions } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { Breakpoint } from 'react-socks';

import Translate from '../../common/Translate';
// ==========================

const buttonsStyle = () => ({
  cardBottomButtons: {
    display: 'block',
    marginTop: '10px',
    padding: 0,
    textAlign: 'center',
    width: '100%',
  },

  bottomButton: {
    margin: '0 4px',
  },

  bottomButtonSmallScreen: {
    marginBottom: '10px',
    width: '100%',
  },
});

class SearchBottomActionButtons extends React.Component {
  render() {
    const { classes, resetResults, resetParentState } = this.props;

    return (
      <CardActions className={classes.cardBottomButtons}>
        <Breakpoint customQuery="(max-width: 450px)">
          <Button
            className={classes.bottomButtonSmallScreen}
            type="submit"
            variant="contained"
            color="default"
            size="large"
          >
            <SearchIcon />
            <Translate>Search</Translate>
          </Button>

          <Button
            className={classes.bottomButtonSmallScreen}
            type="button"
            variant="contained"
            color="default"
            size="large"
            onClick={() => {
              this.setState(this.getInitialState());
              resetResults();
            }}
          >
            <ClearIcon />
            <Translate>Reset</Translate>
          </Button>
        </Breakpoint>

        <Breakpoint customQuery="(min-width: 451px)">
          <Button
            className={classes.bottomButton}
            type="submit"
            variant="contained"
            color="default"
            size="large"
          >
            <SearchIcon />
            <Translate>Search</Translate>
          </Button>

          <Button
            className={classes.bottomButton}
            type="button"
            variant="contained"
            color="default"
            size="large"
            onClick={() => {
              resetParentState();
              resetResults();
            }}
          >
            <ClearIcon />
            <Translate>Reset</Translate>
          </Button>
        </Breakpoint>
      </CardActions>
    );
  }
}

SearchBottomActionButtons.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  resetResults: PropTypes.func.isRequired,
  resetParentState: PropTypes.func.isRequired,
};

export default withStyles(buttonsStyle)(SearchBottomActionButtons);
