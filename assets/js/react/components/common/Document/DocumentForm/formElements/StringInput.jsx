import React from 'react';
import PropTypes from 'prop-types';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@material-ui/core';
import Translate from '../../../Translate';

const StringInput = ({
  fullWidth = true,
  helperText,
  multiline = false,
  required = false,
  hasError = false,
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
      error={hasError}
    >
      <InputLabel>
        <Translate>{valueName}</Translate>
      </InputLabel>
      <FilledInput
        multiline={multiline}
        name={valueName}
        onChange={handleValueChange}
        required={required}
        type="text"
        value={value}
        error={hasError}
      />
      {helperText && (
        <FormHelperText>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
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
  hasError: PropTypes.bool,
};

export default StringInput;
