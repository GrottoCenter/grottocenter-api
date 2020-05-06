import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import Translate from '../../Translate';

// ===================================

const LanguageSelect = ({
  helperText,
  required = false,
  language,
  onLanguageChange,
  itemReferringTo,
}) => {
  const handlelanguageChange = (event) => {
    onLanguageChange(event.target.value);
  };

  return (
    <FormControl variant="filled" required={required} fullWidth>
      <InputLabel htmlFor={`${itemReferringTo}-language`}>
        <Translate>{`${itemReferringTo} Language`}</Translate>
      </InputLabel>
      <Select
        language={language}
        onChange={handlelanguageChange}
        inputProps={{
          name: `${itemReferringTo}-language`,
          id: `${itemReferringTo}-language`,
        }}
      >
        <MenuItem value={0} disabled>
          {`${itemReferringTo} Language`}
        </MenuItem>
        <MenuItem value={1}>ENG</MenuItem>
        <MenuItem value={2}>FR</MenuItem>
        <MenuItem value={3}>ESP</MenuItem>
        <MenuItem value={4}>Todo: get all languages</MenuItem>
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
  helperText: PropTypes.string.isRequired,
  itemReferringTo: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

export default LanguageSelect;
