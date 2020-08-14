import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../actions/Quicksearch';
import Translate from '../components/common/Translate';
import MultipleSelect from '../components/common/Form/MultipleSelect';
import { entityOptionForSelector } from '../helpers/Entity';

const MultipleCaversSelect = ({
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
    isLoading,
    results: searchResults,
  } = useSelector((state) => state.quicksearch);

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        setValue([]);
        break;
      case 'select-option':
      case 'remove-option': {
        // Select only important attributes before updating value
        const cleanedNewValue = newValue.map((caver) => ({
          id: caver.id,
          name: caver.name,
          surname: caver.surname,
          nickname: caver.nickname,
        }));
        setValue(cleanedNewValue);
        break;
      }
      default:
    }
  };

  const loadSearchResults = (inputValue) => {
    dispatch(
      fetchQuicksearchResult({
        query: inputValue,
        resourceTypes: ['cavers'],
        complete: false,
      }),
    );
  };
  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  const hasError = computeHasError(value);
  const memoizedValues = [searchResults, hasError, value];
  return useMemo(
    () => (
      <MultipleSelect
        computeHasError={computeHasError}
        getOptionLabel={(option) =>
          `${option.name}${
            option.surname ? ` ${option.surname.toUpperCase()}` : ''
          }`
        }
        getOptionSelected={(optionToTest, valueToTest) =>
          optionToTest.id === valueToTest.id
        }
        handleOnChange={handleOnChange}
        helperText={helperText}
        isLoading={isLoading}
        labelName={labelName}
        loadSearchResults={loadSearchResults}
        nbCharactersNeededToLaunchSearch={3}
        noOptionsText={
          <Translate>No author matches you search criteria</Translate>
        }
        required={required}
        renderOption={entityOptionForSelector}
        resetSearchResults={resetSearchResults}
        searchErrors={searchErrors}
        searchResults={searchResults}
        value={value}
      />
    ),
    [memoizedValues],
  );
};

MultipleCaversSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default MultipleCaversSelect;
