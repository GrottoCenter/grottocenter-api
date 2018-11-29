import React from 'react';
import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const LanguageItem = withStyles((theme) => ({
  root: {
    fontSize: '16px',
    color: theme.palette.primaryTextColor
  }
}), { withTheme: true })(MenuItem);

const LanguageInput = withStyles((theme) => ({
  root: {
    background: 'none'
  },
  underline: {
    '&:before,&:hover,&:after,&:focus': {
      borderColor: `${theme.palette.textIconColor} !important`,
      background: 'none'
    }
  }
}), { withTheme: true })(Input);

const StyledSelect = withStyles((theme) => ({
  root: {
    paddingLeft: '10px',
    color: theme.palette.textIconColor,
    minWidth: '150px',
    width: 'initial'
  },
  selectMenu: {
    fontSize: '16px',
    minHeight: '12px'
  },
  select: {
    '&:before,&:hover,&:after,,&:focus': {
      background: 'none'
    }
  },
  icon: {
    color: theme.palette.textIconColor,
  }
}), { withTheme: true })(Select);

//
//
// M A I N - C O M P O N E N T
//
//

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
      value={id}
    >
      {localesList[id]}
    </LanguageItem>
  );

  return (
    <StyledSelect
      value={locale}
      onChange={handleChange}
      input={<LanguageInput />}
    >
      {items}
    </StyledSelect>
  );
};

LanguageSelector.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

export default LanguageSelector;
