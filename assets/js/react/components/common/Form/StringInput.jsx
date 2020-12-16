import React from 'react';
import PropTypes from 'prop-types';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@material-ui/core';

const StringInput = ({
  endAdornment,
  fullWidth = true,
  hasError = false,
  helperText,
  multiline = false,
  onValueChange,
  required = false,
  type = 'text',
  value,
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
      error={(required && value === '') || hasError}
    >
      <InputLabel>{valueName}</InputLabel>
      <FilledInput
        endAdornment={endAdornment}
        multiline={multiline}
        name={valueName}
        onChange={handleValueChange}
        required={required}
        type={type}
        value={value}
        error={(required && value === '') || hasError}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

StringInput.propTypes = {
  endAdornment: PropTypes.node,
  fullWidth: PropTypes.bool,
  hasError: PropTypes.bool,
  helperText: PropTypes.string,
  multiline: PropTypes.bool,
  onValueChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  type: PropTypes.oneOf(['text', 'email', 'password']),
  value: PropTypes.string.isRequired,
  valueName: PropTypes.string.isRequired,
};

export default StringInput;
