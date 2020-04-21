/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl, intlShape } from 'react-intl';

import {
  Card,
  CardContent,
  FormControl,
  TextField,
  Switch,
  Typography,
  FormLabel,
  FormHelperText,
} from '@material-ui/core';

import SliderForm from './SliderForm';
import Translate from '../../common/Translate';
import SearchBottomActionButtons from './SearchBottomActionButtons';
import styles from './styles';

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
  handleRangeChange = (
    keyName,
    values,
    minValueAuthorized,
    maxValueAuthorized,
  ) => {
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
      intl,
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
      <Card>
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
            <Typography variant="h6">
              <Translate>Group properties</Translate>
            </Typography>
            <div
              className={classes.formPartContainer}
              style={{ justifyContent: 'flex-start' }}
            >
              <TextField
                className={classes.formElement}
                label={
                  <span>
                    <Translate>Group name</Translate>
                  </span>
                }
                onChange={(event) => this.handleValueChange('name', event)}
                value={name}
              />
              <SliderForm
                label={intl.formatMessage({
                  id: 'Number of cavers',
                })}
                disabled={!numberOfCaversRange.isEditable}
                onDisable={this.handleCheckedChange('number of cavers-range')}
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
                value={[numberOfCaversRange.min, numberOfCaversRange.max]}
              />
            </div>

            <fieldset className={classes.fieldset}>
              <legend className={classes.legend}>
                <Translate>Localization</Translate>
              </legend>

              <div className={classes.formPartContainer}>
                <TextField
                  className={classes.formElement}
                  label={
                    <span>
                      <Translate>City</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('city', event)}
                  value={city}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span>
                      <Translate>Postal code</Translate>
                    </span>
                  }
                  onChange={(event) =>
                    this.handleValueChange('postal_code', event)
                  }
                  value={postal_code}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span>
                      <Translate>County</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('county', event)}
                  value={county}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span>
                      <Translate>Region</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('region', event)}
                  value={region}
                />

                <TextField
                  className={classes.formElement}
                  label={
                    <span>
                      <Translate>Country</Translate>
                    </span>
                  }
                  onChange={(event) => this.handleValueChange('country', event)}
                  value={country}
                />
              </div>
            </fieldset>

            <div
              className={classes.formPartContainer}
              style={{ justifyContent: 'flex-start' }}
            >
              <FormControl>
                <FormLabel className={classes.formLabel}>
                  <span>
                    <Translate>
                      {matchAllFields
                        ? 'Matching all fields'
                        : 'Matching at least one field'}
                    </Translate>
                  </span>
                  <Switch
                    checked={matchAllFields}
                    onChange={this.handleBooleanChange('matchAllFields')}
                    value={matchAllFields}
                  />
                </FormLabel>
                <FormHelperText>
                  <Translate>
                    Specify if the search results must match all the fields you
                    typed above (default is yes).
                  </Translate>
                </FormHelperText>
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

  intl: PropTypes.shape(intlShape).isRequired,
};

GroupsSearch.defaultProps = {
  numberOfCaversMinValue: 0,
  numberOfCaversMaxValue: 100,
};

export default injectIntl(withStyles(styles)(GroupsSearch));
