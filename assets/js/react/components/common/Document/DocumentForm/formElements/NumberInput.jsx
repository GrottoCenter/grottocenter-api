import React from 'react';
import PropTypes from 'prop-types';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@material-ui/core';
import Translate from '../../../Translate';

const NumberInput = ({
  fullWidth = true,
  helperText,
  multiline = false,
  required = false,
  hasError = false,
  onValueChange,
  value,
  valueName,
}) => {
  const [localStringValue, setLocalStringValue] = React.useState(
    value.toString(),
  );
  const [formatErrorText, setFormatErrorText] = React.useState('');
  const hasFormatError = formatErrorText !== '';

  const handleValueChange = (event) => {
    setLocalStringValue(event.target.value);
    const numberValue = Number(event.target.value);
    if (Number.isNaN(numberValue)) {
      setFormatErrorText('Enter a number.');
    } else {
      onValueChange(numberValue);
      setFormatErrorText('');
    }
  };

  return (
    <FormControl
      variant="filled"
      fullWidth={fullWidth}
      required={required}
      error={hasError || hasFormatError}
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
        value={localStringValue}
        error={hasError}
      />
      {helperText && (
        <FormHelperText>
          {formatErrorText && (
            <>
              <b>
                <Translate>{formatErrorText}</Translate>
              </b>
              <br />
            </>
          )}
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
    </FormControl>
  );
};

NumberInput.propTypes = {
  fullWidth: PropTypes.bool,
  helperText: PropTypes.string.isRequired,
  multiline: PropTypes.bool,
  onValueChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.number.isRequired,
  valueName: PropTypes.string.isRequired,
  hasError: PropTypes.bool,
};

export default NumberInput;
