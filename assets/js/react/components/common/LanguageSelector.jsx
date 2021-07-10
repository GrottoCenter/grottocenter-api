import React from 'react';
// import PropTypes from 'prop-types';
import { Select, MenuItem, Input } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import LanguageIcon from '@material-ui/icons/Translate';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';

const LanguageInput = withStyles(
  (theme) => ({
    root: {
      background: 'none',
    },
    underline: {
      '&:before,&:hover,&:after,&:focus': {
        borderColor: `${theme.palette.textIconColor} !important`,
        background: 'none',
      },
    },
  }),
  { withTheme: true },
)(Input);

const StyledSelect = withStyles(
  (theme) => ({
    root: {
      paddingLeft: '10px',
      color: theme.palette.onPrimary.main,
      minWidth: isMobileOnly ? 'auto' : '150px',
      width: 'initial',
    },
    selectMenu: {
      fontSize: '16px',
      minHeight: '12px',
    },
    select: {
      '&:before,&:hover,&:after,,&:focus': {
        background: 'none',
      },
    },
    icon: {
      color: theme.palette.onPrimary.main,
    },
  }),
  { withTheme: true },
)(Select);

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

const LanguageSelector = () => {
  const handleChange = (event) => {
    const { value } = event.target;
    if (value === locale) {
      return;
    }

    // To be uncommented when we will be able to retrieve catalog without page reload
    // props.dispatch(changeLanguage(value));
    window.location = `?lang=${value}`;
  };

  const items = Object.keys(localesList).map((id) => (
    <MenuItem key={id} value={id}>
      {localesList[id]}
    </MenuItem>
  ));

  return (
    <Wrapper>
      <LanguageIcon />
      <StyledSelect
        value={locale}
        onChange={handleChange}
        input={<LanguageInput />}
      >
        {items}
      </StyledSelect>
    </Wrapper>
  );
};
/*
LanguageSelector.propTypes = {
  // eslint-disable-next-line react/require-default-props
  dispatch: PropTypes.func,
};
*/
export default LanguageSelector;
