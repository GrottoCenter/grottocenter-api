import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  dense: {
    marginTop: 19,
  },
  menu: {
    width: 200,
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
  // TODO: Rename variables with names of the API
  state = {
    entryName: '',
    entryMaps: '',
    detailedSheet: '',
    minDepth: 0,
    maxDepth: 1000,
    minLength: 0,
    maxLength: 1000,
    minLatitude: -90,
    maxLatitude: 90,
    minLongitude: -180,
    maxLongitude: 180,
    country: '',
    stateOrRegion: '',
    city: '',
    mountainRange: '',
    caveSystem: '',
    undergroundType: '',
    divingCave: '',
    minAesthetics: 0,
    maxAesthetics: 10,
    minEaseOfMove: 0,
    maxEaseOfMove: 10,
    minEaseOfReach: 0,
    maxEaseOfReach: 10,
    minYearOfDiscovery: 1900,
    maxYearOfDiscovery: new Date().getFullYear(),
    value: { min: 2, max: 10 },
  };

  handleChange = keyName => (event) => {
    this.setState({
      [keyName]: event.target.value,
    });
  };

  render() {
    const { classes } = this.props;
    const {
      entryName,
      entryMaps,
      detailedSheet,
      minDepth,
      maxDepth,
      minLength,
      maxLength,
      minLatitude,
      maxLatitude,
      minLongitude,
      maxLongitude,
      country,
      stateOrRegion,
      city,
      mountainRange,
      caveSystem,
      undergroundType,
      divingCave,
      minAesthetics,
      maxAesthetics,
      minEaseOfMove,
      maxEaseOfMove,
      minEaseOfReach,
      maxEaseOfReach,
      minYearOfDiscovery,
      maxYearOfDiscovery,
      value,
    } = this.state;

    return (
      <React.Fragment>
        <form className={classes.container} noValidate autoComplete="off">
          <TextField
            id="standard-name"
            label="Entry Name"
            className={classes.textField}
            value={entryName}
            onChange={this.handleChange('entryName')}
            margin="normal"
          />
          <TextField
            id="standard-select-currency-native"
            select
            label="Entry maps"
            className={classes.textField}
            value={entryMaps}
            onChange={this.handleChange('entryMaps')}
            SelectProps={{
              native: true,
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
          >
            {yesNoChoices.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <TextField
            id="standard-select-currency-native"
            select
            label="Detailed Sheet"
            className={classes.textField}
            value={detailedSheet}
            onChange={this.handleChange('detailedSheet')}
            SelectProps={{
              native: true,
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
          >
            {yesNoChoices.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <TextField
            id="standard-name"
            label="Depth"
            className={classes.textField}
            value={minDepth}
            onChange={this.handleChange('minDepth')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Length"
            className={classes.textField}
            value={minLength}
            onChange={this.handleChange('minLength')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Latitude"
            className={classes.textField}
            value={minLatitude}
            onChange={this.handleChange('minLatitude')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Longitude"
            className={classes.textField}
            value={minLongitude}
            onChange={this.handleChange('minLongitude')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="State Or Region"
            className={classes.textField}
            value={stateOrRegion}
            onChange={this.handleChange('stateOrRegion')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="City"
            className={classes.textField}
            value={city}
            onChange={this.handleChange('city')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Mountain Range"
            className={classes.textField}
            value={mountainRange}
            onChange={this.handleChange('mountainRange')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Cave System"
            className={classes.textField}
            value={caveSystem}
            onChange={this.handleChange('caveSystem')}
            margin="normal"
          />
          <TextField
            id="standard-select-currency-native"
            select
            label="Underground type"
            className={classes.textField}
            value={undergroundType}
            onChange={this.handleChange('undergroundType')}
            SelectProps={{
              native: true,
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
          >
            {undergroundChoices.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <TextField
            id="standard-select-currency-native"
            select
            label="Diving Cave"
            className={classes.textField}
            value={divingCave}
            onChange={this.handleChange('divingCave')}
            SelectProps={{
              native: true,
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
          >
            {yesNoChoices.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <TextField
            id="standard-name"
            label="Aesthetics"
            className={classes.textField}
            value={minAesthetics}
            onChange={this.handleChange('minAesthetics')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Ease of Move"
            className={classes.textField}
            value={minEaseOfMove}
            onChange={this.handleChange('minEaseOfMove')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Ease of Reach"
            className={classes.textField}
            value={minEaseOfReach}
            onChange={this.handleChange('minEaseOfReach')}
            margin="normal"
          />
          <TextField
            id="standard-name"
            label="Year of discovery"
            className={classes.textField}
            value={minYearOfDiscovery}
            onChange={this.handleChange('minYearOfDiscovery')}
            margin="normal"
          />
        </form>
      </React.Fragment>
    );
  }
}

EntriesSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(EntriesSearch);
