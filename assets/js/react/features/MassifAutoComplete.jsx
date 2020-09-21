import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { InputAdornment } from '@material-ui/core';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../actions/Quicksearch';

import { entityOptionForSelector } from '../helpers/Entity';

import SearchBar from '../components/appli/Document/DocumentForm/formElements/SearchBar';
import FormAutoComplete from '../components/appli/Document/DocumentForm/formElements/FormAutoComplete';

// ===================================

const resultEndAdornment = (
  <InputAdornment position="end">
    <img src="/images/massif.svg" alt="Massif icon" style={{ width: '40px' }} />
  </InputAdornment>
);

// ===================================

const getMassifToString = (massif) => {
  return `#${massif.id} - ${massif.name}`;
};

const MassifAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  searchLabelText,
}) => {
  const dispatch = useDispatch();
  const { errors, isLoading, results: suggestions } = useSelector(
    (state) => state.quicksearch,
  );

  const fetchSearchResults = (debouncedInput) => {
    const criterias = {
      query: debouncedInput.trim(),
      complete: false,
      resourceType: 'massifs',
    };
    dispatch(fetchQuicksearchResult(criterias));
  };

  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <SearchBar
          fetchSearchResults={fetchSearchResults}
          getOptionLabel={getMassifToString}
          getValueName={getMassifToString}
          hasError={!isNil(errors)}
          isLoading={isLoading}
          label={searchLabelText}
          renderOption={entityOptionForSelector}
          resetSearchResults={resetSearchResults}
          searchLabelText={searchLabelText}
          suggestions={suggestions}
          contextValueName={contextValueName}
          resourceSearchedType="massifs"
        />
      }
      contextValueName={contextValueName}
      getValueName={getMassifToString}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
    />
  );
};

MassifAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired,
};

export default MassifAutoComplete;
