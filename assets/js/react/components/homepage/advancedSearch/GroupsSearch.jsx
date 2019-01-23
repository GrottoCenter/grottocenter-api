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

class GroupsSearch extends React.Component {
  // TODO: Handle the max of depth and length dynamically

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
    city: '',
    county: '',
    country: '',
    name: '',
    postal_code: '',
    region: '',
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
      city,
      county,
      country,
      name,
      postal_code,
      region,
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
            <h5 style={{ width: '100%' }}><Translate>Group properties</Translate></h5>

            <TextField
              className={classes.formElement}
              label={(
                <span className={classes.formElementFontSize}>
                  <Translate>Group name</Translate>
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

            <fieldset className={classes.fieldset}>
              <legend className={classes.legend}><Translate>Localization</Translate></legend>

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>City</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('city', event)}
                value={city}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>Postal code</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('postal_code', event)}
                value={postal_code}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>County</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('county', event)}
                value={county}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>Region</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('region', event)}
                value={region}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>Country</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('country', event)}
                value={country}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />

            </fieldset>

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

GroupsSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  resetResults: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,
};

GroupsSearch.defaultProps = {

};

export default withStyles(styles)(GroupsSearch);
