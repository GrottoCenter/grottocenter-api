import React from 'react';
import PropTypes from 'prop-types';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FormHelperText, TextField } from '@material-ui/core';

import Translate from '../../../Translate';

const MultipleSelect = ({
  allPossibleValues,
  getOptionLabel,
  hasError = false,
  helperText,
  labelName,
  onValuesChange,
  required = false,
  value,
}) => {
  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        onValuesChange([]);
        break;
      case 'select-option':
        onValuesChange(newValue);
        break;
      case 'remove-option':
        onValuesChange(newValue);
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
      />
      {helperText && (
        <FormHelperText variant="filled" error={hasError}>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
    </>
  );
};

MultipleSelect.propTypes = {
  allPossibleValues: PropTypes.arrayOf(PropTypes.shape({})),
  getOptionLabel: PropTypes.func.isRequired,
  hasError: PropTypes.bool,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  onValuesChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.arrayOf(PropTypes.shape({})),
};

export default MultipleSelect;
