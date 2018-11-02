import React from 'react';
import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';
//import {changeLanguage} from '../actions/Language';

const languageItemStyles = (theme) => ({
  root: {
    fontSize: '16px',
    color: theme.palette.primaryTextColor
  }
});

const LanguageItem = withStyles(languageItemStyles, { withTheme: true })(MenuItem);

const inputStyles = (theme) => ({
  underline: {
    borderColor: theme.palette.textIconColor
  }
});

const LanguageInput = withStyles(inputStyles, { withTheme: true })(Input);

const languageSelectorStyles = (theme) => ({
  root: {
    paddingLeft: '10px',
    color: theme.palette.textIconColor,
    minWidth: '150px',
    width: 'initial'
  },
  selectMenu: {
    fontSize: '16px',
  }
});

const LanguageSelector  = (props) => {
  const handleChange = (event) => {
    const value = event.target.value;
    if (value === locale) {
      return;
    }
    // To be uncommented when we will be able to retrieve catalog without page relaod
    // this.props.dispatch(changeLanguage(value));
    window.location = '?lang=' + value;
  };

  const items = Object.keys(localesList).map(id => <LanguageItem
      key={id}
      classes={props.classes.menuItem}
      value={id}
    >
      {localesList[id]}
    </LanguageItem>
  );

  return (
    <Select
      classes={props.classes}
      value={locale}
      onChange={handleChange}
      input={<LanguageInput />}
    >
      {items}
    </Select>
  );
};

LanguageSelector.propTypes = {
  dispatch: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired
};

export default withStyles(languageSelectorStyles, { withTheme: true })(LanguageSelector);
