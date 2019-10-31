/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';

import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import {
  FormLabel, FormControl, TextField, Switch, InputLabel, Select,
  MenuItem, Typography, withStyles, CardActions, CardContent, Card,
  Button,
} from '@material-ui/core';

import Slider from 'rc-slider';
import Translate from '../../common/Translate';
import InternationalizedLink from '../../common/InternationalizedLink';
import { wikiBBSLinks } from '../../../conf/Config';

// =====================================

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

class BbsSearch extends React.Component {
  /*
    The state is created with particular key names because, these names are directly linked to
    the names of these properties in Elasticsearch. Here we have a syntax that
    allow us to distinguish search range parameters from others parameters.
  */
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
    this.handleValueChange = this.handleValueChange.bind(this);
    this.getThemeObjFromId = this.getThemeObjFromId.bind(this);
    this.getSubthemeObjFromId = this.getSubthemeObjFromId.bind(this);
    props.getSubThemes();
  }

  getInitialState = () => {
    const { yearMinValue, yearMaxValue } = this.props;

    return ({
      'bbs year-range': {
        isEditable: false,
        min: yearMinValue,
        max: yearMaxValue,
      },
      'bbs numericalRef': '',
      'bbs title': '',
      'bbs authors': '',
      'bbs abstract': '',
      'bbs theme': '',
      'bbs subtheme': '',
      'bbs country': '',
      filteredSubthemes: [],
    });
  }

  componentDidUpdate = () => {
    const { subthemes } = this.props;
    const { filteredSubthemes } = this.state;

    /*
      Update only when the filtered subthemes are empty.
      Then, they are fully managed by the component itself.
    */
    if (filteredSubthemes !== subthemes && filteredSubthemes.length === 0) {
      this.setState({
        filteredSubthemes: subthemes,
      });
    }
  }

  getThemeObjFromId = (id) => {
    const { themes } = this.props;
    return themes.find((t) => t.id === id);
  }

  getSubthemeObjFromId = (id) => {
    const { subthemes } = this.props;
    return subthemes.find((st) => st.id === id);
  }

  /**
   * keyName: String
   * event: Event
   * This function changes the state of the keyName property
   * with the value of the target event.
   * It also filters the themes and subthemes mutually.
   */
  handleValueChange = (keyName, event) => {
    if (keyName === 'bbs theme') {
      const { subthemes } = this.props;
      // Repopulate all subthemes
      if (event.target.value === '') {
        this.setState({
          filteredSubthemes: subthemes,
          'bbs theme': '',
        });
        return;
      }

      // Filter subthemes
      const themeObj = this.getThemeObjFromId(event.target.value);
      const newFilteredSubthemes = subthemes.filter((st) => st.id.split('.')[0] === themeObj.id);

      // Eventually, empty the subtheme if it's not valid anymore regarding the new theme
      const { 'bbs subtheme': subtheme } = this.state;
      let newSubthemeId = subtheme;
      if (!newFilteredSubthemes.find((st) => st.id === newSubthemeId)) {
        newSubthemeId = '';
      }

      this.setState({
        filteredSubthemes: newFilteredSubthemes,
        'bbs subtheme': newSubthemeId,
        'bbs theme': themeObj.id,
      });
      return;
    }

    // Select appropriate theme according to the subtheme and filter subthemes
    if (keyName === 'bbs subtheme' && event.target.value !== '') {
      const { themes, subthemes } = this.props;
      const subthemeObj = this.getSubthemeObjFromId(event.target.value);
      const themeObj = themes.find((t) => t.id === subthemeObj.id.split('.')[0]);
      const newFilteredSubthemes = subthemes.filter((st) => st.id.split('.')[0] === themeObj.id);
      this.setState({
        'bbs theme': themeObj.id,
        'bbs subtheme': subthemeObj.id,
        filteredSubthemes: newFilteredSubthemes,
      });
      return;
    }

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
  handleCheckedChange = (keyName) => (event) => {
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
      yearMinValue, yearMaxValue,
      themes,
    } = this.props;

    const {
      'bbs year-range': yearRange,
      'bbs ref': ref,
      'bbs title': title,
      'bbs authors': authors,
      'bbs abstract': abstract,
      'bbs theme': theme,
      'bbs subtheme': subtheme,
      'bbs country': country,
      'bbs publication': publication,
      filteredSubthemes,
    } = this.state;

    return (
      <Card
        className={classes.cardContainer}
      >
        <CardContent>

          <Typography variant="body1" gutterBottom paragraph style={{fontStyle: 'italic'}}>
            <Translate>
              {'The BBS ("Bulletin Bibliographique Spéléologique" in french) is an annual review of the worldwide speleological litterature.'}
            </Translate>
            {' '}
            <InternationalizedLink links={wikiBBSLinks}>
              <Translate>
                {'You can find more info about the BBS on the dedicated Grottocenter-wiki page.'}
              </Translate>
            </InternationalizedLink>
          </Typography>

          <h5><Translate>BBS properties</Translate></h5>

          <form
            noValidate
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();

              // We don't want to use filteredSubthemes for the search
              const stateToSearch = { ...this.state };
              delete stateToSearch.filteredSubthemes;

              // Get theme and subtheme name from id
              const subthemeObj = this.getSubthemeObjFromId(stateToSearch['bbs subtheme']);
              const themeObj = this.getThemeObjFromId(stateToSearch['bbs theme']);
              stateToSearch['bbs subtheme'] = subthemeObj ? subthemeObj.name : '';
              stateToSearch['bbs theme'] = themeObj ? themeObj.name : '';
              startAdvancedsearch(stateToSearch, resourceType);
            }}
            className={classes.formContainer}
          >
            <div className={classes.formPartContainer} style={{ justifyContent: 'flex-start' }}>

              <fieldset className={classes.fieldset}>
                <legend className={classes.legend}><Translate>Content</Translate></legend>

                <div className={classes.formPartContainer}>
                  <TextField
                    className={classes.formElement}
                    label={(
                      <span className={classes.formElementFontSize}>
                        <Translate>Title</Translate>
                      </span>
                    )}
                    onChange={(event) => this.handleValueChange('bbs title', event)}
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
                        <Translate>Abstract</Translate>
                      </span>
                    )}
                    onChange={(event) => this.handleValueChange('bbs abstract', event)}
                    value={abstract}
                    InputProps={{
                      classes: {
                        input: classes.formElementFontSize,
                      },
                    }}
                  />
                </div>
              </fieldset>

              <fieldset className={classes.fieldset}>
                <legend className={classes.legend}><Translate>Subject</Translate></legend>

                <div className={classes.formPartContainer}>
                  <FormControl className={classes.formElement}>
                    <InputLabel htmlFor="bbs theme"><Translate>Theme</Translate></InputLabel>
                    <Select
                      value={theme}
                      onChange={(event) => this.handleValueChange('bbs theme', event)}
                      inputProps={{
                        name: 'theme',
                        id: 'bbs theme',
                      }}
                    >
                      <MenuItem key={-1} value=""><i><Translate>All themes</Translate></i></MenuItem>
                      {themes.map((choiceTheme) => (
                        <MenuItem key={choiceTheme.id} value={choiceTheme.id}>
                          {choiceTheme.id}
                          {'\u00a0-\u00a0'}
                          <Translate>{choiceTheme.name}</Translate>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl className={classes.formElement}>
                    <InputLabel htmlFor="bbs subtheme"><Translate>Subtheme</Translate></InputLabel>
                    <Select
                      value={subtheme}
                      onChange={(event) => this.handleValueChange('bbs subtheme', event)}
                      inputProps={{
                        name: 'subtheme',
                        id: 'bbs subtheme',
                      }}
                    >
                      <MenuItem key={-1} value=""><i><Translate>All subthemes</Translate></i></MenuItem>
                      {filteredSubthemes.map((choiceSubtheme) => (
                        <MenuItem key={choiceSubtheme.id} value={choiceSubtheme.id}>
                          {choiceSubtheme.id}
                          {'\u00a0-\u00a0'}
                          <Translate>{choiceSubtheme.name}</Translate>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                </div>
              </fieldset>

              <TextField
                className={classes.formElement}
                label={(
                  <span className={classes.formElementFontSize}>
                    <Translate>Reference</Translate>
                  </span>
                )}
                onChange={(event) => this.handleValueChange('bbs ref', event)}
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
                    <Translate>Country or region</Translate>
                  </span>
                )}
                onChange={(event) => this.handleValueChange('bbs country', event)}
                value={country}
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
                onChange={(event) => this.handleValueChange('bbs authors', event)}
                value={authors}
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
                    <Translate>Publication</Translate>
                  </span>
                )}
                onChange={(event) => this.handleValueChange('bbs publication', event)}
                value={publication}
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
                  tipFormatter={(value) => `${value}`}
                  value={[yearRange.min, yearRange.max]}
                  disabled={!yearRange.isEditable}
                  trackStyle={[!yearRange.isEditable ? { backgroundColor: '#9e9e9e' } : { backgroundColor: '#ff9800' }]}
                  handleStyle={[{ backgroundColor: '#795548', borderColor: '#795548' }, { backgroundColor: '#795548', borderColor: '#795548' }]}
                />

                <div style={{ display: 'inline-flex', justifyContent: 'space-between' }}>
                  <TextField
                    onChange={(event) => this.handleRangeChange('bbs year-range', [parseInt(event.target.value, 10) || 0, yearRange.max], 0, 2100)}
                    value={yearRange.min}
                    disabled={!yearRange.isEditable}
                    style={{ width: '50px' }}
                  />
                  <TextField
                    onChange={(event) => this.handleRangeChange('bbs year-range', [yearRange.min, parseInt(event.target.value, 10) || 0], 0, 2100)}
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
  getSubThemes: PropTypes.func.isRequired,
  subthemes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  themes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,

  yearMinValue: PropTypes.number,
  yearMaxValue: PropTypes.number,
};

BbsSearch.defaultProps = {
  yearMinValue: 1800,
  yearMaxValue: new Date().getFullYear(),
};

export default withStyles(styles)(BbsSearch);
