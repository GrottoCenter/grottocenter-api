import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import LanguageIcon from '@material-ui/icons/Translate';
import Translate from '../../../Translate';

// ===================================

const LanguageSelect = ({
  allLanguages,
  hasError = false,
  helperText,
  itemReferringTo,
  required = false,
  language,
  onLanguageChange,
}) => {
  const handleLanguageChange = (event) => {
    onLanguageChange(event.target.value);
  };

  const handleChange = (event, child) => {
    const newLanguage = {
      id: event.target.value,
      name: child.props.name,
    };
    updateAttribute(contextValueNameToUpdate, newLanguage);
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
        <InputLabel htmlFor={`${itemReferringTo}-language`}>
          <LanguageIcon style={{ verticalAlign: 'middle' }} />
          <Translate>{`${itemReferringTo} Language`}</Translate>
        </InputLabel>

        <Select
          value={language === null ? -1 : language.id}
          onChange={handleChange}
          inputProps={{
            name: `${itemReferringTo}-language`,
            id: `${itemReferringTo}-language`,
          }}
        >
          <MenuItem key={-1} value={-1} disabled>
            <i>
              <Translate>Select a language</Translate>
            </i>
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <FormHelperText>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
    </FormControl>
  );
};

LanguageSelect.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  hasError: PropTypes.bool,
  helperText: PropTypes.string.isRequired,
  itemReferringTo: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

export default LanguageSelect;
