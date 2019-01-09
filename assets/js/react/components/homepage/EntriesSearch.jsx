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
  constructor(props) {
    super(props);
    this.state = {
      caveSystem: '',
      city: '',
      country: '',
      detailedSheet: '',
      divingCave: '',
      entryName: '',
      entryMaps: '',
      minAesthetics: 0,
      maxAesthetics: 10,
      minEaseOfMove: 0,
      maxEaseOfMove: 10,
      minEaseOfReach: 0,
      maxEaseOfReach: 10,
      minDepth: 0,
      maxDepth: 80000,
      minLatitude: -90,
      maxLatitude: 90,
      minLength: 0,
      maxLength: 1000,
      minLongitude: -180,
      maxLongitude: 180,
      minYearOfDiscovery: 1900,
      maxYearOfDiscovery: new Date().getFullYear(),
      mountainRange: '',
      stateOrRegion: '',
      undergroundType: '',
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
      [`min${keyName}`]: values[0],
      [`max${keyName}`]: values[1],
    });
  };

  render() {
    const { classes } = this.props;
    const {
      caveSystem,
      city,
      country,
      divingCave,
      entryName,
      entryMaps,
      detailedSheet,
      minAesthetics, maxAesthetics,
      minDepth, maxDepth,
      minEaseOfMove, maxEaseOfMove,
      minEaseOfReach, maxEaseOfReach,
      minLength, maxLength,
      minLatitude, maxLatitude,
      minLongitude, maxLongitude,
      minYearOfDiscovery, maxYearOfDiscovery,
      mountainRange,
      stateOrRegion,
      undergroundType,
    } = this.state;

    return (
      <React.Fragment>
        <form className={classes.container} noValidate autoComplete="off">
          <TextField
            className={classes.formElement}
            helperText="TODO: helper text?"
            label={<Translate>Entry name</Translate>}
            onChange={event => this.handleValueChange('entryName', event)}
            value={entryName}
          />

          <FormControl
            className={classes.formElement}
          >
            <InputLabel shrink htmlFor="entry-maps-native-label-placeholder">
              Entry maps
            </InputLabel>
            <NativeSelect
              value={entryMaps}
              onChange={event => this.handleValueChange('entryMaps', event)}
              input={<Input name="entry-maps" id="entry-maps-native-label-placeholder" />}
            >
              <option value="">None</option>
              <option value={10}>Ten</option>
              <option value={20}>Twenty</option>
              <option value={30}>Thirty</option>
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
              max={80000}
              onChange={(values) => {
                this.handleRangeChange('Depth', values);
              }}
              tipFormatter={value => `${value}m`}
              value={[minDepth, maxDepth]}
            />
            <p>
              {minDepth}
              m -
              {' '}
              {maxDepth}
              m
            </p>
          </FormControl>
        </form>
      </React.Fragment>
    );
  }
}

EntriesSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(EntriesSearch);
