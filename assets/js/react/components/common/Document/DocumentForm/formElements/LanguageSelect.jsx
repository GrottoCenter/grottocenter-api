import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import Translate from '../../../Translate';

// ===================================

const LanguageSelect = ({
  allLanguages,
  helperText,
  required = false,
  language,
  onLanguageChange,
  itemReferringTo,
}) => {
  const handleLanguageChange = (event) => {
    onLanguageChange(event.target.value);
  };

  return (
    <FormControl variant="filled" required={required} fullWidth>
      <InputLabel htmlFor={`${itemReferringTo}-language`}>
        <Translate>{`${itemReferringTo} Language`}</Translate>
      </InputLabel>
      <Select
        language={language}
        onChange={handleLanguageChange}
        inputProps={{
          name: `${itemReferringTo}-language`,
          id: `${itemReferringTo}-language`,
        }}
      >
        <MenuItem value={0} disabled>
          {`${itemReferringTo} Language`}
        </MenuItem>
        {allLanguages.map((l) => (
          <MenuItem value={l.id}>{l.name}</MenuItem>
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
  helperText: PropTypes.string.isRequired,
  itemReferringTo: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

export default LanguageSelect;
