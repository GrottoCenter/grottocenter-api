import React from 'react';
import styled from 'styled-components';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Collapse,
} from '@material-ui/core';

import { isNil } from 'ramda';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import Translate from '../Translate';
import { FormAutoCompleteTypes } from './types';

const StyledInput = styled(FilledInput)`
  ${({ theme }) => `
  color: ${theme.palette.primaryTextColor} !important;
  `}
`;

const StyledFormControl = styled(FormControl)`
  ${({ theme }) => `
  background-color: ${theme.palette.primary3Color};
  `};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

// eslint-disable-next-line react/prop-types
const ExpandIcon = ({ isOpen }) => (isOpen ? <ExpandLess /> : <ExpandMore />);

const FormAutoComplete = ({
  autoCompleteSearch,
  getValueName,
  hasError,
  helperContent,
  label,
  required,
  resultEndAdornment,
  value,
  onSideAction,
  sideActionIcon,
  sideActionDisabled = true,
  isSideActionOpen = false,
  children,
}) => {
  return (
    <>
      <FormControl
        variant="filled"
        required={required}
        error={hasError}
        fullWidth
      >
        <InputLabel error={required && value === null}>
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
            <InputWrapper>
              {autoCompleteSearch}
              {!isNil(children) && (
                <Collapse in={isSideActionOpen}>{children}</Collapse>
              )}
            </InputWrapper>
            {!isNil(onSideAction) && (
              <IconButton
                size="small"
                onClick={onSideAction}
                disabled={sideActionDisabled}
                color="secondary"
                aria-label="new entity"
              >
                {!isNil(sideActionIcon) ? (
                  sideActionIcon
                ) : (
                  <ExpandIcon isOpen={isSideActionOpen} />
                )}
              </IconButton>
            )}
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
