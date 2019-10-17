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

import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Slider from 'rc-slider';

import Translate from '../../common/Translate';

const Range = Slider.createSliderWithTooltip(Slider.Range);


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

class BbsSearch extends React.Component {  /*
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
    const { yearMinValue, yearMaxValue } = this.props;

    return ({
      'bbs year-range': {
        isEditable: false,
        min: yearMinValue,
        max: yearMaxValue,
      },
      'bbs ref': '',
      'bbs title': '',
      'bbs authors' : ''
    });
  }

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

  render() {
    const {
      classes,
      resourceType,
      resetResults,
      startAdvancedsearch,

      yearMinValue, yearMaxValue
    } = this.props;

    const {
      'bbs year-range': yearRange,
      'bbs ref': ref,
      'bbs title': title,
      'bbs authors': authors
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
            <h5 style={{ width: '100%' }}><Translate>BBS properties</Translate></h5>

            <div className={classes.formPartContainer} style={{ justifyContent: 'flex-start' }}>

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>Reference</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('bbs ref', event)}
                value={ref}
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
                    <Translate>Title</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('bbs title', event)}
                value={title}
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
                    <Translate>Authors</Translate>
                  </span>
                )}
                onChange={event => this.handleValueChange('bbs authors', event)}
                value={authors}
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
                  <span className={classes.formElementFontSize}>
                    <Translate>Year</Translate>
                  </span>
                  <Switch
                    checked={yearRange.isEditable}
                    onChange={this.handleCheckedChange('bbs year-range')}
                    value={yearRange.isEditable}
                    classes={{
                      switchBase: classes.colorSwitchBase,
                      checked: classes.colorChecked,
                      bar: classes.colorBar,
                    }}
                  />
                </FormLabel>
                <Range
                  className={classes.formRange}
                  min={yearMinValue}
                  max={yearMaxValue}
                  onChange={(values) => {
                    this.handleRangeChange('bbs year-range', values, yearMinValue, yearMaxValue);
                  }}
                  tipFormatter={value => `${value}`}
                  value={[yearRange.min, yearRange.max]}
                  disabled={!yearRange.isEditable}
                  trackStyle={[!yearRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                  handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
                />

                <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                  <TextField
                    onChange={event => this.handleRangeChange('bbs year-range', [parseInt(event.target.value, 10) || 0, yearRange.max], 0, 2100)}
                    value={yearRange.min}
                    disabled={!yearRange.isEditable}
                    style={{ width: '50px' }}
                  />
                  <TextField
                    onChange={event => this.handleRangeChange('bbs year-range', [yearRange.min, parseInt(event.target.value, 10) || 0], 0, 2100)}
                    value={yearRange.max}
                    disabled={!yearRange.isEditable}
                    style={{ width: '50px' }}
                  />
                </div>
              </FormControl>

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

BbsSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  resetResults: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,

  yearMinValue: PropTypes.number,
  yearMaxValue: PropTypes.number,
};

BbsSearch.defaultProps = {
  yearMinValue: 1800,
  yearMaxValue: new Date().getFullYear(),
};

export default withStyles(styles)(BbsSearch);
