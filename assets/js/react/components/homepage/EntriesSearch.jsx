import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import SearchIcon from '@material-ui/icons/Search';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import FormLabel from '@material-ui/core/FormLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Slider from 'rc-slider';

import Translate from '../common/Translate';

const Range = Slider.createSliderWithTooltip(Slider.Range);

const styles = theme => ({
  mainContainer: {
    backgroundColor: theme.palette.primary.light,
  },
  cardContainer: {},
  formContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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

  cardActions: {
    marginTop: '10px',
    padding: 0,
    width: '100%',
  },
  searchButton: {
    margin: 'auto',
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
        min: props.aestheticismMinValue,
        max: props.aestheticismMaxValue,
      },
      'approach-range': {
        isEditable: false,
        min: props.approachMinValue,
        max: props.approachMaxValue,
      },
      'cave depth-range': {
        isEditable: false,
        min: props.caveDepthMinValue,
        max: props.caveDepthMaxValue,
      },
      'cave is diving': '',
      'cave length-range': {
        isEditable: false,
        min: props.caveLengthMinValue,
        max: props.caveLengthMaxValue,
      },
      'cave name': '',
      city: '',
      country: '',
      county: '',
      'caving-range': {
        isEditable: false,
        min: props.cavingMinValue,
        max: props.cavingMaxValue,
      },
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
      'massif name': '',
      name: '',
      region: '',
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
   * If the values given are > (or <) to the minValueAuthorized (or maxValueAuthorized),
   * it set it to the min/maxValueAuthorized.
   */
  handleRangeChange = (keyName, values, minValueAuthorized, maxValueAuthorized) => {
    const newState = {
      [keyName]: {
        ...this.state[keyName],
        min: (values[0] < minValueAuthorized ? minValueAuthorized : values[0]),
        max: (values[1] > maxValueAuthorized ? maxValueAuthorized : values[1]),
      },
    };

    this.setState(newState);
  };

  render() {
    const {
      classes,
      startAdvancedsearch,
      resourceType,
      aestheticismMinValue, aestheticismMaxValue,
      approachMinValue, approachMaxValue,
      caveDepthMinValue, caveDepthMaxValue,
      caveLengthMinValue, caveLengthMaxValue,
      cavingMinValue, cavingMaxValue,
    } = this.props;
    const {
      'aestheticism-range': aestheticismRange,
      'approach-range': approachRange,
      'cave depth-range': caveDepthRange,
      'cave is diving': caveIsDiving,
      'cave length-range': caveLengthRange,
      'cave name': caveName,
      // 'caving-range': cavingRange,
      city,
      country,
      county,
      'caving-range': cavingRange,
      // 'latitude-range': latitudeRange,maxValueAuthorized
      // 'longitude-range': longitudeRange,
      'massif name': massifName,
      name,
      region,
      // 'underground type': undergroundType,
      // 'year_discovery-range': yearOfDiscoveryRange,
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
            <h5 style={{ width: '100%' }}><Translate>Entry properties</Translate></h5>

            <TextField
              className={classes.formElement}
              label={<Translate>Entry name</Translate>}
              onChange={event => this.handleValueChange('name', event)}
              value={name}
              InputProps={{
                classes: {
                  input: classes.formElementFontSize,
                },
              }}
            />

            <TextField
              className={classes.formElement}
              label={<Translate>City</Translate>}
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
              label={<Translate>County</Translate>}
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
              label={<Translate>Region</Translate>}
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
              label={<Translate>Country</Translate>}
              onChange={event => this.handleValueChange('country', event)}
              value={country}
              InputProps={{
                classes: {
                  input: classes.formElementFontSize,
                },
              }}
            />

            <TextField
              className={classes.formElement}
              label={<Translate>Massif name</Translate>}
              onChange={event => this.handleValueChange('massif name', event)}
              value={massifName}
              InputProps={{
                classes: {
                  input: classes.formElementFontSize,
                },
              }}
            />

            <FormControl
              className={classes.formElement}
            >
              <FormLabel>
                <Translate>Aesthetic</Translate>
                <Switch
                  checked={aestheticismRange.isEditable}
                  onChange={this.handleCheckedChange('aestheticism-range')}
                  value={aestheticismRange.isEditable}
                  classes={{
                    switchBase: classes.colorSwitchBase,
                    checked: classes.colorChecked,
                    bar: classes.colorBar,
                  }}
                />
              </FormLabel>
              <Range
                className={classes.formRange}
                min={aestheticismMinValue}
                max={aestheticismMaxValue}
                onChange={(values) => {
                  this.handleRangeChange('aestheticism-range', values, aestheticismMinValue, aestheticismMaxValue);
                }}
                tipFormatter={value => `${value}`}
                value={[aestheticismRange.min, aestheticismRange.max]}
                disabled={!aestheticismRange.isEditable}
                trackStyle={[!aestheticismRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
              />

              <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                <TextField
                  onChange={event => this.handleRangeChange('aestheticism-range', [parseInt(event.target.value, 10) || 0, aestheticismRange.max], aestheticismMinValue, aestheticismMaxValue)}
                  value={aestheticismRange.min}
                  disabled={!aestheticismRange.isEditable}
                  style={{ width: '50px' }}
                />
                <TextField
                  onChange={event => this.handleRangeChange('aestheticism-range', [aestheticismRange.min, parseInt(event.target.value, 10) || 0], aestheticismMinValue, aestheticismMaxValue)}
                  value={aestheticismRange.max}
                  disabled={!aestheticismRange.isEditable}
                  style={{ width: '50px' }}
                />
              </div>
            </FormControl>

            <FormControl
              className={classes.formElement}
            >
              <FormLabel>
                <Translate>Ease of move</Translate>
                <Switch
                  checked={cavingRange.isEditable}
                  onChange={this.handleCheckedChange('caving-range')}
                  value={cavingRange.isEditable}
                  classes={{
                    switchBase: classes.colorSwitchBase,
                    checked: classes.colorChecked,
                    bar: classes.colorBar,
                  }}
                />
              </FormLabel>
              <Range
                className={classes.formRange}
                min={cavingMinValue}
                max={cavingMaxValue}
                onChange={(values) => {
                  this.handleRangeChange('caving-range', values, cavingMinValue, cavingMaxValue);
                }}
                tipFormatter={value => `${value}`}
                value={[cavingRange.min, cavingRange.max]}
                disabled={!cavingRange.isEditable}
                trackStyle={[!cavingRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
              />

              <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                <TextField
                  onChange={event => this.handleRangeChange('caving-range', [parseInt(event.target.value, 10) || 0, cavingRange.max], cavingMinValue, cavingMaxValue)}
                  value={cavingRange.min}
                  disabled={!cavingRange.isEditable}
                  style={{ width: '50px' }}
                />
                <TextField
                  onChange={event => this.handleRangeChange('caving-range', [cavingRange.min, parseInt(event.target.value, 10) || 0], cavingMinValue, cavingMaxValue)}
                  value={cavingRange.max}
                  disabled={!cavingRange.isEditable}
                  style={{ width: '50px' }}
                />
              </div>
            </FormControl>

            <FormControl
              className={classes.formElement}
            >
              <FormLabel>
                <Translate>Ease of reach</Translate>
                <Switch
                  checked={approachRange.isEditable}
                  onChange={this.handleCheckedChange('approach-range')}
                  value={approachRange.isEditable}
                  classes={{
                    switchBase: classes.colorSwitchBase,
                    checked: classes.colorChecked,
                    bar: classes.colorBar,
                  }}
                />
              </FormLabel>
              <Range
                className={classes.formRange}
                min={aestheticismMinValue}
                max={aestheticismMaxValue}
                onChange={(values) => {
                  this.handleRangeChange('approach-range', values, approachMinValue, approachMaxValue);
                }}
                tipFormatter={value => `${value}`}
                value={[approachRange.min, approachRange.max]}
                disabled={!approachRange.isEditable}
                trackStyle={[!approachRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
              />

              <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                <TextField
                  onChange={event => this.handleRangeChange('approach-range', [parseInt(event.target.value, 10) || 0, approachRange.max], approachMinValue, approachMaxValue)}
                  value={approachRange.min}
                  disabled={!approachRange.isEditable}
                  style={{ width: '50px' }}
                />
                <TextField
                  onChange={event => this.handleRangeChange('approach-range', [approachRange.min, parseInt(event.target.value, 10) || 0], approachMinValue, approachMaxValue)}
                  value={approachRange.max}
                  disabled={!approachRange.isEditable}
                  style={{ width: '50px' }}
                />
              </div>
            </FormControl>

            <hr />

            <h5 style={{ width: '100%' }}><Translate>Cave properties</Translate></h5>

            <TextField
              className={classes.formElement}
              label={<Translate>Cave name</Translate>}
              onChange={event => this.handleValueChange('cave name', event)}
              value={caveName}
              InputProps={{
                classes: {
                  input: classes.formElementFontSize,
                },
              }}
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
                classes={{
                  select: classes.formElementFontSize,
                }}
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
                <Translate>Depth</Translate>
                <Switch
                  checked={caveDepthRange.isEditable}
                  onChange={this.handleCheckedChange('cave depth-range')}
                  value={caveDepthRange.isEditable}
                  classes={{
                    switchBase: classes.colorSwitchBase,
                    checked: classes.colorChecked,
                    bar: classes.colorBar,
                  }}
                />
              </FormLabel>
              <Range
                className={classes.formRange}
                min={caveDepthMinValue}
                max={caveDepthMaxValue}
                onChange={(values) => {
                  this.handleRangeChange('cave depth-range', values, caveDepthMinValue, caveDepthMaxValue);
                }}
                tipFormatter={value => `${value}m`}
                value={[caveDepthRange.min, caveDepthRange.max]}
                disabled={!caveDepthRange.isEditable}
                trackStyle={[!caveDepthRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
              />

              <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                <TextField
                  onChange={event => this.handleRangeChange('cave depth-range', [parseInt(event.target.value, 10) || 0, caveDepthRange.max], caveDepthMinValue, caveDepthMaxValue)}
                  value={caveDepthRange.min}
                  disabled={!caveDepthRange.isEditable}
                  InputProps={{
                    endAdornment: <InputAdornment position="start">m</InputAdornment>,
                  }}
                  style={{ width: '50px' }}
                />
                <TextField
                  onChange={event => this.handleRangeChange('cave depth-range', [caveDepthRange.min, parseInt(event.target.value, 10) || 0], caveDepthMinValue, caveDepthMaxValue)}
                  value={caveDepthRange.max}
                  disabled={!caveDepthRange.isEditable}
                  InputProps={{
                    endAdornment: <InputAdornment position="start">m</InputAdornment>,
                  }}
                  style={{ width: '50px' }}
                />
              </div>
            </FormControl>

            <FormControl
              className={classes.formElement}
            >
              <FormLabel>
                <Translate>Length</Translate>
                <Switch
                  checked={caveLengthRange.isEditable}
                  onChange={this.handleCheckedChange('cave length-range')}
                  value={caveLengthRange.isEditable}
                  classes={{
                    switchBase: classes.colorSwitchBase,
                    checked: classes.colorChecked,
                    bar: classes.colorBar,
                  }}
                />
              </FormLabel>
              <Range
                className={classes.formRange}
                min={caveLengthMinValue}
                max={caveLengthMaxValue}
                onChange={(values) => {
                  this.handleRangeChange('cave length-range', values, caveLengthMinValue, caveLengthMaxValue);
                }}
                tipFormatter={value => `${value}m`}
                value={[caveLengthRange.min, caveLengthRange.max]}
                disabled={!caveLengthRange.isEditable}
                trackStyle={[!caveLengthRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
              />

              <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                <TextField
                  onChange={event => this.handleRangeChange('cave length-range', [parseInt(event.target.value, 10) || 0, caveLengthRange.max], caveLengthMinValue, caveLengthMaxValue)}
                  value={caveLengthRange.min}
                  disabled={!caveLengthRange.isEditable}
                  InputProps={{
                    endAdornment: <InputAdornment position="start">m</InputAdornment>,
                  }}
                  style={{ width: '50px' }}
                />
                <TextField
                  onChange={event => this.handleRangeChange('cave length-range', [caveLengthRange.min, parseInt(event.target.value, 10) || 0], caveLengthMinValue, caveLengthMaxValue)}
                  value={caveLengthRange.max}
                  disabled={!caveLengthRange.isEditable}
                  InputProps={{
                    endAdornment: <InputAdornment position="start">m</InputAdornment>,
                  }}
                  style={{ width: '50px' }}
                />
              </div>
            </FormControl>

            <CardActions className={classes.cardActions}>
              <Button type="submit" variant="contained" color="default" className={classes.searchButton} size="large">
                <SearchIcon />
                <Translate>Search</Translate>
              </Button>
            </CardActions>

          </form>
        </CardContent>
      </Card>
    );
  }
}

EntriesSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,

  // Min / max values for form
  aestheticismMinValue: PropTypes.number,
  aestheticismMaxValue: PropTypes.number,
  approachMinValue: PropTypes.number,
  approachMaxValue: PropTypes.number,
  cavingMinValue: PropTypes.number,
  cavingMaxValue: PropTypes.number,

  caveDepthMinValue: PropTypes.number,
  caveDepthMaxValue: PropTypes.number,
  caveLengthMinValue: PropTypes.number,
  caveLengthMaxValue: PropTypes.number,
};

EntriesSearch.defaultProps = {
  aestheticismMinValue: 0,
  aestheticismMaxValue: 10,
  approachMinValue: 0,
  approachMaxValue: 10,
  cavingMinValue: 0,
  cavingMaxValue: 10,

  caveDepthMinValue: 0,
  caveDepthMaxValue: 2000,
  caveLengthMinValue: 0,
  caveLengthMaxValue: 700000,
};

export default withStyles(styles)(EntriesSearch);
