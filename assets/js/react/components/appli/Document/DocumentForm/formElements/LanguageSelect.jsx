import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import LanguageIcon from '@material-ui/icons/Translate';
import Translate from '../../../../common/Translate';

// ===================================

const LanguageSelect = ({
  allLanguages = [],
  handleLanguageChange,
  helperText,
  labelText,
  language,
  required = false,
}) => {
  const handleChange = (event, child) => {
    const newLanguage = {
      id: event.target.value,
      refName: child.props.refName,
    };
    handleLanguageChange(newLanguage);
  };

  const memoizedValues = [allLanguages, language];
  return useMemo(
    () => (
      <FormControl
        variant="filled"
        required={required}
        fullWidth
        error={required && language === null}
      >
        <InputLabel htmlFor={labelText}>
          <LanguageIcon style={{ verticalAlign: 'middle' }} />
          <Translate>{labelText}</Translate>
        </InputLabel>

        <Select
          value={language === null ? -1 : language.id}
          onChange={handleChange}
          inputProps={{
            name: `${labelText}`,
            id: `${labelText}`,
          }}
        >
          <MenuItem key={-1} value={-1} disabled>
            <i>
              <Translate>Select a language</Translate>
            </i>
          </MenuItem>
          {allLanguages.map((l) => (
            <MenuItem key={l.id} value={l.id} refName={l.refName}>
              <Translate>{l.refName}</Translate>
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <FormHelperText>
            <Translate>{helperText}</Translate>
          </FormHelperText>
        )}
      </FormControl>
    ),
    memoizedValues,
  );
};

LanguageSelect.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired,
    }),
  ),
  handleLanguageChange: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelText: PropTypes.string.isRequired,
  language: PropTypes.shape({
    id: PropTypes.number.isRequired,
    refName: PropTypes.string.isRequired,
  }),
  required: PropTypes.bool,
};

export default LanguageSelect;
