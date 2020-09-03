import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
} from '@material-ui/core';

import Translate from '../Translate';

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
  autoCompleteSearch: PropTypes.node,
  getValueName: PropTypes.func.isRequired,
  hasError: PropTypes.bool.isRequired,
  helperContent: PropTypes.node,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool.isRequired,
  resultEndAdornment: PropTypes.node,
  value: PropTypes.shape({}),
};

export default FormAutoComplete;
