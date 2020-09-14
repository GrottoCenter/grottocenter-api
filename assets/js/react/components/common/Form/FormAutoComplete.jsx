import React from 'react';
import styled from 'styled-components';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@material-ui/core';

import Translate from '../Translate';
import { FormAutoCompleteTypes } from './types';

// ===================================
const StyledInput = styled(FilledInput)`
  ${({ theme }) => `
  color: ${theme.palette.primaryTextColor} !important;
  `}
`;

const StyledFormControl = styled(FormControl)`
  ${({ theme }) => `
  background-color: ${theme.palette.primary3Color};
  `}
`;
// ===================================

const FormAutoComplete = ({
  autoCompleteSearch,
  getValueName,
  hasError,
  helperContent,
  label,
  required,
  resultEndAdornment,
  value,
}) => {
  return (
    <>
      <FormControl
        variant="filled"
        required={required}
        error={hasError}
        fullWidth
      >
        <InputLabel>
          <Translate>{label}</Translate>
        </InputLabel>
        <StyledInput
          disabled
          value={value !== null ? getValueName(value) : ''}
          endAdornment={resultEndAdornment}
        />

        {autoCompleteSearch && (
          <StyledFormControl
            variant="filled"
            required={required}
            error={hasError}
          >
            {autoCompleteSearch}
          </StyledFormControl>
        )}

        {helperContent && <FormHelperText>{helperContent}</FormHelperText>}
      </FormControl>
    </>
  );
};

FormAutoComplete.propTypes = {
  ...FormAutoCompleteTypes,
};

export default FormAutoComplete;
