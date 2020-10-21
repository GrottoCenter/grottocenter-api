import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

import Translate from '../components/common/Translate';
import MultipleSelectComponent from '../components/appli/Document/DocumentForm/formElements/MultipleSelect';
import { loadRegionsSearch, resetRegionsSearch } from '../actions/Region';

const MultipleBBSRegionsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false,
}) => {
  const dispatch = useDispatch();
  const { error, isFetching, bbsRegionsByName: searchResults } = useSelector(
    (state) => state.region,
  );

  const loadSearchResults = (inputValue) => {
    dispatch(loadRegionsSearch(inputValue, inputValue, true));
  };
  const resetSearchResults = () => {
    dispatch(resetRegionsSearch());
  };

  return (
    <MultipleSelectComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionSelected={(optionToTest, valueToTest) =>
        optionToTest.id === valueToTest.id
      }
      getOptionLabel={(option) => {
        if (option.name === null) {
          return option.code;
        }
        return `${option.code} - ${option.name}`;
      }}
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
      searchError={pathOr(null, ['message'], error)}
      searchResults={searchResults}
    />
  );
};

MultipleBBSRegionsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default MultipleBBSRegionsSelect;
