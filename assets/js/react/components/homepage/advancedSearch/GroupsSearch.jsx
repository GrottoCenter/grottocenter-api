/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import { Card, CardContent, FormControl, FormLabel, TextField, Switch } from '@material-ui/core';

import Slider from 'rc-slider';

import Translate from '../../common/Translate';
import SearchBottomActionButtons from './SearchBottomActionButtons';

// ==========

const Range = Slider.createSliderWithTooltip(Slider.Range);

const styles = (theme) => ({
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
    justifyContent: 'space-evenly',
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
  // TODO: Handle the max of number of cavers dynamically

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

  getInitialState = () => {
    const { numberOfCaversMinValue, numberOfCaversMaxValue } = this.props;

    return {
      'number of cavers-range': {
        isEditable: false,
        min: numberOfCaversMinValue,
        max: numberOfCaversMaxValue,
      },
      city: '',
      county: '',
      country: '',
      name: '',
      postal_code: '',
      region: '',
      matchAllFields: true,
    };
  };

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

  /**
   * This function set the state of the keyname property
   * to be the same value of the range.
   * If the values given are > (or <) to the minValueAuthorized (or maxValueAuthorized),
   * it set it to the min/maxValueAuthorized.
   */
  handleRangeChange = (keyName, values, minValueAuthorized, maxValueAuthorized) => {
    const newState = {
      [keyName]: {
        ...this.state[keyName],
        min: values[0] < minValueAuthorized ? minValueAuthorized : values[0],
        max: values[1] > maxValueAuthorized ? maxValueAuthorized : values[1],
      },
    };
    this.setState(newState);
  };

  /**
   * This function set the state of the keyname property
   * to be the same value as the event of the slider.
   */
  handleCheckedChange = (keyName) => (event) => {
    const newState = {
      [keyName]: {
        ...this.state[keyName],
        isEditable: event.target.checked,
      },
    };
    this.setState(newState);
  };

  handleBooleanChange = (keyName) => (event) => {
    this.setState({
      [keyName]: event.target.checked,
    });
  };

  resetToInitialState = () => {
    this.setState(this.getInitialState());
  };

  render() {
    const {
      classes,
      resourceType,
      resetResults,
      startAdvancedsearch,

      numberOfCaversMinValue,
      numberOfCaversMaxValue,
    } = this.props;

    const {
      'number of cavers-range': numberOfCaversRange,
      city,
      county,
      country,
      name,
      postal_code,
      region,
      matchAllFields,
    } = this.state;

    return (
      <Card className={classes.cardContainer}>
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
            <h5 style={{ width: '100%' }}>
              <Translate>Group properties</Translate>
            </h5>

            <div className={classes.formPartContainer} style={{ justifyContent: 'flex-start' }}>
              <TextField
                className={classes.formElement}
                label={
                  <span className={classes.formElementFontSize}>
                    <Translate>Group name</Translate>
                  </span>
                }
                onChange={(event) => this.handleValueChange('name', event)}
                value={name}
                InputProps={{
                  classes: {
                    input: classes.formElementFontSize,
                  },
                }}
              />

              <FormControl className={classes.formElement}>
                <FormLabel>
                  <span className={classes.formElementFontSize}>
                    <Translate>Number of cavers</Translate>
                  </span>
                  <Switch
                    checked={numberOfCaversRange.isEditable}
                    onChange={this.handleCheckedChange('number of cavers-range')}
                    value={numberOfCaversRange.isEditable}
                    classes={{
                      switchBase: classes.colorSwitchBase,
                      checked: classes.colorChecked,
                      bar: classes.colorBar,
                    }}
                  />
                </FormLabel>
                <Range
                  className={classes.formRange}
                  min={numberOfCaversMinValue}
                  max={numberOfCaversMaxValue}
                  onChange={(values) => {
                    this.handleRangeChange(
                      'number of cavers-range',
                      values,
                      numberOfCaversMinValue,
                      numberOfCaversMaxValue,
                    );
                  }}
                  tipFormatter={(value) => `${value}`}
                  value={[numberOfCaversRange.min, numberOfCaversRange.max]}
                  disabled={!numberOfCaversRange.isEditable}
                  trackStyle={[
                    !numberOfCaversRange.isEditable
                      ? { backgroundColor: '#9e9e9e' }
                      : { backgroundColor: '#ff9800' },
                  ]}
                  handleStyle={[
                    { backgroundColor: '#795548', borderColor: '#795548' },
                    { backgroundColor: '#795548', borderColor: '#795548' },
                  ]}
                />

                <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                  <TextField
                    onChange={(event) =>
                      this.handleRangeChange(
                        'number of cavers-range',
                        [parseInt(event.target.value, 10) || 0, numberOfCaversRange.max],
                        numberOfCaversMinValue,
                        numberOfCaversMaxValue,
                      )
                    }
                    value={numberOfCaversRange.min}
                    disabled={!numberOfCaversRange.isEditable}
                    style={{ width: '30px' }}
                  />
                  <TextField
                    onChange={(event) =>
                      this.handleRangeChange(
                        'number of cavers-range',
                        [numberOfCaversRange.min, parseInt(event.target.value, 10) || 0],
                        numberOfCaversMinValue,
                        numberOfCaversMaxValue,
                      )
                    }
                    value={numberOfCaversRange.max}
                    disabled={!numberOfCaversRange.isEditable}
                    style={{ width: '30px' }}
                  />
                </div>
              </FormControl>
            </div>

            <fieldset className={classes.fieldset}>
              <legend className={classes.legend}>
                <Translate>Localization</Translate>
              </legend>

              <div className={classes.formPartContainer}>
                <TextField
                  className={classes.formElement}
                  label={
                    <span className={classes.formElementFontSize}>
                      <Translate>City</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('city', event)}
                  value={city}
                  InputProps={{
                    classes: {
                      input: classes.formElementFontSize,
                    },
                  }}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span className={classes.formElementFontSize}>
                      <Translate>Postal code</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('postal_code', event)}
                  value={postal_code}
                  InputProps={{
                    classes: {
                      input: classes.formElementFontSize,
                    },
                  }}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span className={classes.formElementFontSize}>
                      <Translate>County</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('county', event)}
                  value={county}
                  InputProps={{
                    classes: {
                      input: classes.formElementFontSize,
                    },
                  }}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span className={classes.formElementFontSize}>
                      <Translate>Region</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('region', event)}
                  value={region}
                  InputProps={{
                    classes: {
                      input: classes.formElementFontSize,
                    },
                  }}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span className={classes.formElementFontSize}>
                      <Translate>Country</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('country', event)}
                  value={country}
                  InputProps={{
                    classes: {
                      input: classes.formElementFontSize,
                    },
                  }}
                />
              </div>
            </fieldset>

            <div className={classes.formPartContainer} style={{ justifyContent: 'flex-start' }}>
              <FormControl>
                <FormLabel>
                  <span className={classes.formElementFontSize}>
                    <Translate>
                      {matchAllFields ? 'Matching all fields' : 'Matching at least one field'}
                    </Translate>
                  </span>
                  <Switch
                    checked={matchAllFields}
                    onChange={this.handleBooleanChange('matchAllFields')}
                    value={matchAllFields}
                    classes={{
                      switchBase: classes.colorSwitchBase,
                      checked: classes.colorChecked,
                      bar: classes.colorBar,
                    }}
                  />
                  <br />
                  <i>
                    <Translate className={classes.formElementFontSize}>
                      Specify if the search results must match all the fields you typed above
                      (default is yes).
                    </Translate>
                  </i>
                </FormLabel>
              </FormControl>
            </div>

            <SearchBottomActionButtons
              resetResults={resetResults}
              resetParentState={this.resetToInitialState}
            />
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

  // Min / max values for form
  numberOfCaversMinValue: PropTypes.number,
  numberOfCaversMaxValue: PropTypes.number,
};

GroupsSearch.defaultProps = {
  numberOfCaversMinValue: 0,
  numberOfCaversMaxValue: 100,
};

export default withStyles(styles)(GroupsSearch);
