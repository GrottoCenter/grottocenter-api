import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormLabel from '@material-ui/core/FormLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import TextField from '@material-ui/core/TextField';
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

const yesNoChoices = [
  {
    value: 'All',
    label: 'All',
  },
  {
    value: 'True',
    label: 'Yes',
  },
  {
    value: 'False',
    label: 'No',
  },
];

const undergroundChoices = [
  {
    value: 'All',
    label: 'All',
  },
  {
    value: '1',
    label: 'Cavities in evaporite (gypsum, salt)',
  },
  {
    value: '2',
    label: 'Ice cave (cave under the glacier...)',
  },
  {
    value: '3',
    label: 'Karstic (all carbonate rocks)',
  },
  {
    value: '4',
    label: 'Lava tube',
  },
  {
    value: '5',
    label: 'Other (granite, quartzite, laterite, ...)',
  },
];

class EntriesSearch extends React.Component {
  // TODO: Handle the max of depth and length dynamically
  constructor(props) {
    super(props);
    this.state = {
      'aestheticism-min': 0,
      'aestheticism-max': 10,
      'approach-min': 0,
      'approach-max': 10,
      'cave depth-min': 0,
      'cave depth-max': 2000,
      'cave is diving': '',
      'cave length-min': 0,
      'cave length-max': 700000,
      'caving-min': 0,
      'caving-max': 10,
      city: '',
      country: '',
      county: '',
      'latitude-min': -90,
      'latitude-max': 90,
      'longitude-min': -180,
      'longitude-max': 180,
      'massif range': '',
      name: '',
      'underground type': '',
      'year_discovery-min': 1900,
      'year_discovery-max': new Date().getFullYear(),
    };
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleRangeChange = this.handleRangeChange.bind(this);
  }

  handleValueChange = (keyName, event) => {
    this.setState({
      [keyName]: event.target.value,
    });
  };

  handleRangeChange = (keyName, values) => {
    this.setState({
      [`${keyName}-min`]: values[0],
      [`${keyName}-max`]: values[1],
    });
  };

  render() {
    const { classes, startAdvancedsearch, resourceType } = this.props;
    const {
      'aestheticism-min': aestheticMin,
      'aestheticism-max': aestheticMax,
      'approach-min': easeOfReachMin,
      'approach-max': easeOfReachMax,
      'cave depth-min': caveDepthMin,
      'cave depth-max': caveDepthMax,
      'cave is diving': caveIsDiving,
      'cave length-min': caveLengthMin,
      'cave length-max': caveLengthMax,
      'caving-min': easeOfMoveMin,
      'caving-max': easeOfMoveMax,
      city,
      country,
      county,
      'latitude-min': latitudeMin,
      'latitude-max': latitudeMax,
      'longitude-min': longitudeMin,
      'longitude-max': longitudeMax,
      'massif range': massifRange,
      name,
      'underground type': undergroundType,
      'year_discovery-min': yearOfDiscoveryMin,
      'year_discovery-max': yearOfDiscoveryMax,
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
              <option value="true">Yes</option>
              <option value="false">No</option>
            </NativeSelect>
          </FormControl>

          <FormControl
            className={classes.formElement}
          >
            <FormLabel>
              <Translate>Depth</Translate>
            </FormLabel>
            <Range
              className={classes.formRange}
              min={0}
              max={2000}
              onChange={(values) => {
                this.handleRangeChange('cave depth', values);
              }}
              tipFormatter={value => `${value}m`}
              value={[caveDepthMin, caveDepthMax]}
            />
            <p>
              {caveDepthMin}
              m -
              {' '}
              {caveDepthMax}
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
