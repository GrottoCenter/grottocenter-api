import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FormHelperText, TextField } from '@material-ui/core';

import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

const MultipleSelect = ({
  allPossibleValues,
  contextValueNameToUpdate,
  getOptionLabel,
  computeHasError,
  helperText,
  labelName,
  required = false,
}) => {
  const context = useContext(DocumentFormContext);
  const { updateAttribute } = context;
  const value = context.docAttributes[contextValueNameToUpdate];

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        updateAttribute(contextValueNameToUpdate, []);
        break;
      case 'select-option':
      case 'remove-option':
        updateAttribute(contextValueNameToUpdate, newValue);
        break;
      default:
    }
  };

  const hasError = computeHasError(value);
  const memoizedValues = [allPossibleValues, hasError, value];
  return useMemo(
    () => (
      <>
        <Autocomplete
          multiple
          value={value}
          id={labelName}
          options={allPossibleValues}
          onChange={handleOnChange}
          getOptionLabel={getOptionLabel}
          getOptionSelected={(optionToTest, valueToTest) =>
            optionToTest.id === valueToTest.id
          }
          filterSelectedOptions
          noOptionsText={
            <Translate>No options matching you search criteria</Translate>
          }
          required={required}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="filled"
              label={<Translate>{labelName}</Translate>}
              required={required}
              error={hasError}
            />
          )}
        />
        {helperText && (
          <FormHelperText variant="filled" error={hasError}>
            <Translate>{helperText}</Translate>
          </FormHelperText>
        )}
      </>
    ),
    [memoizedValues],
  );
};

MultipleSelect.propTypes = {
  allPossibleValues: PropTypes.arrayOf(PropTypes.shape({})),
  contextValueNameToUpdate: PropTypes.string.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  computeHasError: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default MultipleSelect;
