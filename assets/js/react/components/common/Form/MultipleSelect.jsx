import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FormHelperText, TextField } from '@material-ui/core';
import { length } from 'ramda';

import { useDebounce } from '../../../hooks';
import Translate from '../Translate';

const MultipleBBSRegionsSelect = ({
  computeHasError,
  getOptionLabel,
  handleOnChange,
  helperText,
  isLoading = false,
  labelName,
  loadSearchResults,
  nbCharactersNeededToLaunchSearch = 3,
  noOptionsText,
  required = false,
  resetSearchResults,
  searchErrors,
  searchResults,
  value,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const debouncedInput = useDebounce(inputValue);

  const handleInputChange = (event, newValue, reason) => {
    switch (reason) {
      case 'reset':
      case 'clear':
        setInputValue('');
        break;

      case 'input':
        setInputValue(newValue);
        break;

      default:
        break;
    }
  };

  React.useEffect(() => {
    if (length(debouncedInput) >= nbCharactersNeededToLaunchSearch) {
      loadSearchResults(debouncedInput.trim());
    } else {
      resetSearchResults();
    }
  }, [debouncedInput]);

  const hasError = computeHasError(value);
  const memoizedValues = [searchResults, hasError, value];
  return useMemo(
    () => (
      <>
        <Autocomplete
          multiple
          value={value}
          id={labelName}
          options={searchResults}
          onChange={handleOnChange}
          onInputChange={handleInputChange}
          inputValue={inputValue}
          loading={isLoading}
          getOptionLabel={getOptionLabel}
          getOptionSelected={(optionToTest, valueToTest) =>
            optionToTest.code === valueToTest.code
          }
          filterSelectedOptions
          noOptionsText={
            inputValue.length >= nbCharactersNeededToLaunchSearch ? (
              noOptionsText
            ) : (
              <Translate>
                Enter at least {nbCharactersNeededToLaunchSearch} characters
              </Translate>
            )
          }
          required={required}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="filled"
              label={<Translate>{labelName}</Translate>}
              required={required}
              error={hasError || searchErrors}
            />
          )}
        />
        {helperText && (
          <FormHelperText variant="filled" error={hasError || searchErrors}>
            <Translate>{helperText}</Translate>
          </FormHelperText>
        )}
      </>
    ),
    [memoizedValues],
  );
};

MultipleBBSRegionsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  handleOnChange: PropTypes.func.isRequired, // handleOnChange(event: object, value: T | T[], reason: string)
  helperText: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  labelName: PropTypes.string.isRequired,
  loadSearchResults: PropTypes.func.isRequired, // should load new search results according to the search string entered by the user
  nbCharactersNeededToLaunchSearch: PropTypes.number,
  noOptionsText: PropTypes.node,
  required: PropTypes.bool,
  resetSearchResults: PropTypes.func.isRequired, // should reset all the search results
  searchErrors: PropTypes.arrayOf(PropTypes.any).isRequired,
  searchResults: PropTypes.arrayOf(PropTypes.any).isRequired,
  value: PropTypes.shape({}).isRequired,
};

export default MultipleBBSRegionsSelect;
