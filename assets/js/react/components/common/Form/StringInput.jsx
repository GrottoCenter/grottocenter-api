import React from 'react';
import PropTypes from 'prop-types';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@material-ui/core';

const StringInput = ({
  fullWidth = true,
  helperText,
  multiline = false,
  required = false,
  value,
  onValueChange,
  valueName,
}) => {
  const handleValueChange = (event) => {
    onValueChange(event.target.value);
  };

  return (
    <FormControl
      variant="filled"
      fullWidth={fullWidth}
      required={required}
      error={required && value === ''}
    >
      <InputLabel>{valueName}</InputLabel>
      <FilledInput
        multiline={multiline}
        name={valueName}
        onChange={handleValueChange}
        required={required}
        type="text"
        value={value}
        error={required && value === ''}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

StringInput.propTypes = {
  fullWidth: PropTypes.bool,
  helperText: PropTypes.string.isRequired,
  multiline: PropTypes.bool,
  onValueChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string.isRequired,
  valueName: PropTypes.string.isRequired,
};

export default StringInput;
