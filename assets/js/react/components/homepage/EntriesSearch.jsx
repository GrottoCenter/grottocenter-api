import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormLabel from '@material-ui/core/FormLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Slider from 'rc-slider';


import Translate from '../common/Translate';

const Range = Slider.createSliderWithTooltip(Slider.Range);

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formElement: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  formRange: {
    marginTop: '12px',
    minWidth: '200px',
    width: '25rem',
  },
});

class EntriesSearch extends React.Component {
  // TODO: Handle the max of depth and length dynamically

  /*
    The state is created with particular key names because, these names are directly linked to
    the names of these properties in Elasticsearch. Here we have a syntax that
    enable us to distinguish range parameters from others parameters.
   */
  constructor(props) {
    super(props);
    this.state = {
      'aestheticism-range': {
        isEditable: false,
        min: 0,
        max: 10,
      },
      'approach-range': {
        isEditable: false,
        min: 0,
        max: 10,
      },
      'cave depth-range': {
        isEditable: false,
        min: 0,
        max: 2000,
      },
      'cave is diving': '',
      'cave length-range': {
        isEditable: false,
        min: 0,
        max: 700000,
      },
      'caving-range': {
        isEditable: false,
        min: 0,
        max: 10,
      },
      city: '',
      country: '',
      county: '',
      'latitude-range': {
        isEditable: false,
        min: -90,
        max: 90,
      },
      'longitude-range': {
        isEditable: false,
        min: -180,
        max: 180,
      },
      'massif range': '',
      name: '',
      'underground type': '',
      'year_discovery-range': {
        isEditable: false,
        min: -1,
        max: new Date().getFullYear(),
      },
    };
    this.handleCheckedChange = this.handleCheckedChange.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleRangeChange = this.handleRangeChange.bind(this);
  }

  /**
   * This function set the state of the keyname property
   * to be the same value as the event of the slider.
   */
  handleCheckedChange = keyName => (event) => {
    const newState = {
      [keyName]: {
        ...this.state[keyName],
        isEditable: event.target.checked,
      },
    };
    this.setState(newState);
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
   */
  handleRangeChange = (keyName, values) => {
    const newState = {
      [keyName]: {
        ...this.state[keyName],
        min: values[0],
        max: values[1],
      },
    };
    this.setState(newState);
  };

  render() {
    const { classes, startAdvancedsearch, resourceType } = this.props;
    const {
      'aestheticism-range': aestheticRange,
      'approach-range': easeOfReachRange,
      'cave depth-range': caveDepthRange,
      'cave is diving': caveIsDiving,
      'cave length-range': caveLengthRange,
      'caving-range': cavingRange,
      city,
      country,
      county,
      'latitude-range': latitudeRange,
      'longitude-range': longitudeRange,
      'massif range': massifRange,
      name,
      'underground type': undergroundType,
      'year_discovery-range': yearOfDiscoveryRange,
    } = this.state;

    return (
      <React.Fragment>
        <form
          className={classes.container}
          noValidate
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            startAdvancedsearch(this.state, resourceType);
          }
          }
        >
          <TextField
            className={classes.formElement}
            helperText="TODO: helper text?"
            label={<Translate>Entry name</Translate>}
            onChange={event => this.handleValueChange('name', event)}
            value={name}
          />

          <FormControl
            className={classes.formElement}
          >
            <InputLabel shrink htmlFor="cave-is-diving-native-label-placeholder">
              Diving Cave
            </InputLabel>
            <NativeSelect
              value={caveIsDiving}
              onChange={event => this.handleValueChange('cave is diving', event)}
              input={<Input name="cave-is-diving" id="cave-is-diving-native-label-placeholder" />}
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </NativeSelect>
          </FormControl>

          <FormControl
            className={classes.formElement}
          >
            <FormLabel>
              <Switch
                checked={caveDepthRange.isEditable}
                onChange={this.handleCheckedChange('cave depth-range')}
                value={caveDepthRange.isEditable}
              />
              <Translate>Depth</Translate>
            </FormLabel>
            <Range
              className={classes.formRange}
              min={0}
              max={2000}
              onChange={(values) => {
                this.handleRangeChange('cave depth-range', values);
              }}
              tipFormatter={value => `${value}m`}
              value={[caveDepthRange.min, caveDepthRange.max]}
              disabled={!caveDepthRange.isEditable}
            />
            <p>
              {caveDepthRange.min}
              m -
              {' '}
              {caveDepthRange.max}
              m
            </p>
          </FormControl>
          <button type="submit">
            <Translate>Search</Translate>
          </button>
        </form>
      </React.Fragment>
    );
  }
}

EntriesSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,
};

export default withStyles(styles)(EntriesSearch);
