import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../actions/Quicksearch';

import Translate from '../components/common/Translate';

import MultipleSelectComponent from '../components/appli/Document/DocumentForm/formElements/MultipleSelect';

import { entityOptionForSelector } from '../helpers/Entity';

const MultipleCaversSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false,
}) => {
  const dispatch = useDispatch();
  const { error: searchError, isLoading, results: searchResults } = useSelector(
    (state) => state.quicksearch,
  );

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

  return (
    <MultipleSelectComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionLabel={(option) =>
        `${option.name}${
          option.surname ? ` ${option.surname.toUpperCase()}` : ''
        }`
      }
      getOptionSelected={(optionToTest, valueToTest) =>
        optionToTest.id === valueToTest.id
      }
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
      searchError={searchError}
      searchResults={searchResults}
    />
  );
};

MultipleCaversSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default MultipleCaversSelect;
