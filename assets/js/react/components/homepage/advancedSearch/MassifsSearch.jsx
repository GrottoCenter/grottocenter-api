/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import TextField from '@material-ui/core/TextField';

import Translate from '../../common/Translate';


const styles = theme => ({
  mainContainer: {},
  cardContainer: {},
  fieldset: {
    border: `1px solid ${theme.palette.primary.light}`,
    width: '100%',
  },
  formPartContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  legend: {
    padding: '0 5px',
  },
  formContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  formElement: {
    flex: 1,
    maxWidth: '30rem',
    minWidth: '20rem',
    marginLeft: '1rem',
    marginRight: '1rem',
    marginBottom: '10px',
  },
  formRange: {},
  formElementFontSize: {
    fontSize: '1.4rem',
  },
  colorSwitchBase: {
    '&$colorChecked': {
      color: theme.palette.accent1Color,
      '& + $colorBar': {
        backgroundColor: theme.palette.accent1Color,
      },
    },
  },
  colorBar: {},
  colorChecked: {},

  cardBottomButtons: {
    display: 'block',
    marginTop: '10px',
    padding: 0,
    textAlign: 'center',
    width: '100%',
  },
});

class MassifsSearch extends React.Component {
  /*
    The state is created with particular key names because, these names are directly linked to
    the names of these properties in Elasticsearch. Here we have a syntax that
    allow us to distinguish search range parameters from others parameters.
   */
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  getInitialState = () => ({
    name: '',
  })

  /**
   * keyName: String
   * event: Event
   * This function changes the state of the keyName property
   * with the value of the target event.
   */
  handleValueChange = (keyName, event) => {
    this.setState({
      [keyName]: event.target.value,
    });
  };

  render() {
    const {
      classes,
      resourceType,
      resetResults,
      startAdvancedsearch,
    } = this.props;

    const {
      name,
    } = this.state;

    return (
      <Card
        className={classes.cardContainer}
      >
        <CardContent>
          <form
            noValidate
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              startAdvancedsearch(this.state, resourceType);
            }}
            className={classes.formContainer}
          >
            <h5 style={{ width: '100%' }}><Translate>Massif properties</Translate></h5>

            <div className={classes.formPartContainer} style={{ justifyContent: 'flex-start' }}>
              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>Massif name</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('name', event)}
                value={name}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />
            </div>

            <CardActions className={classes.cardBottomButtons}>
              <Button
                type="submit"
                variant="contained"
                color="default"
                size="large"
              >
                <SearchIcon />
                <Translate>Search</Translate>
              </Button>

              <Button
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
            </CardActions>

          </form>
        </CardContent>
      </Card>
    );
  }
}

MassifsSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  resetResults: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,
};

MassifsSearch.defaultProps = {

};

export default withStyles(styles)(MassifsSearch);
