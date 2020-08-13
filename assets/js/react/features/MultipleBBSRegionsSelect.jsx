import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import Translate from '../components/common/Translate';
import MultipleSelect from '../components/common/Form/MultipleSelect';
import { loadRegionsSearch, resetRegionsSearch } from '../actions/Region';

const MultipleBBSRegionsSelect = ({
  computeHasError,
  helperText,
  labelName,
  required = false,
  setValue,
  value,
}) => {
  const dispatch = useDispatch();
  const {
    errors: searchErrors,
    isFetching,
    bbsRegionsByName: searchResults,
  } = useSelector((state) => state.region);

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        setValue([]);
        break;
      case 'select-option':
      case 'remove-option':
        setValue(newValue);
        break;
      default:
    }
  };

  const loadSearchResults = (inputValue) => {
    dispatch(loadRegionsSearch(inputValue, inputValue, true));
  };
  const resetSearchResults = () => {
    dispatch(resetRegionsSearch());
  };

  const hasError = computeHasError(value);
  const memoizedValues = [searchResults, hasError, value];
  return useMemo(
    () => (
      <MultipleSelect
        computeHasError={computeHasError}
        getOptionSelected={(optionToTest, valueToTest) =>
          optionToTest.id === valueToTest.id
        }
        getOptionLabel={(option) => {
          if (option.name === null) {
            return option.code;
          }
          return `${option.code} - ${option.name}`;
        }}
        handleOnChange={handleOnChange}
        helperText={helperText}
        isLoading={isFetching}
        labelName={labelName}
        loadSearchResults={loadSearchResults}
        nbCharactersNeededToLaunchSearch={1}
        noOptionsText={
          <Translate>No region matches you search criteria</Translate>
        }
        required={required}
        resetSearchResults={resetSearchResults}
        searchErrors={searchErrors}
        searchResults={searchResults}
        value={value}
      />
    ),
    [memoizedValues],
  );
};

MultipleBBSRegionsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default MultipleBBSRegionsSelect;
