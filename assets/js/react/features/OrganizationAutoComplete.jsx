import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { isNil, length } from 'ramda';
import { InputAdornment } from '@material-ui/core';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../actions/Quicksearch';
import { useDebounce } from '../hooks';

import { entityOptionForSelector } from '../helpers/Entity';
import AutoCompleteSearch from '../components/common/AutoCompleteSearch';
import DocumentFormAutoComplete from '../components/common/Document/DocumentForm/formElements/DocumentFormAutoComplete';

// ===================================

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src="/images/club.svg"
      alt="Organization icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

// ===================================

const getOrganizationToString = (organization) => {
  return `#${organization.id} - ${organization.name}`;
};

const SearchBar = ({ isValueForced, searchLabelText, setValue, value }) => {
  const [inputValue, setInputValue] = React.useState('');
  const dispatch = useDispatch();
  const { errors, isLoading, results: suggestions } = useSelector(
    (state) => state.quicksearch,
  );
  const debouncedInput = useDebounce(inputValue);

  const handleInputChange = (newValue) => {
    if (value && getOrganizationToString(value) === newValue) {
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const handleSelection = (newValue) => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (newValue !== null) {
      setValue(newValue);
    }
    setInputValue('');
  };

  React.useEffect(() => {
    if (length(debouncedInput) > 2) {
      const criterias = {
        query: debouncedInput.trim(),
        complete: false,
        resourceType: 'grottos',
      };
      dispatch(fetchQuicksearchResult(criterias));
    } else {
      dispatch(resetQuicksearch());
    }
  }, [debouncedInput]);

  return (
    <AutoCompleteSearch
      onInputChange={handleInputChange}
      inputValue={inputValue}
      onSelection={handleSelection}
      label={searchLabelText}
      suggestions={suggestions}
      renderOption={entityOptionForSelector}
      getOptionLabel={getOrganizationToString}
      hasError={!isNil(errors)}
      isLoading={isLoading}
      disabled={isValueForced}
    />
  );
};

const OrganizationAutoComplete = ({
  helperContent,
  helperContentIfValueIsForced,
  isValueForced,
  labelText,
  required = false,
  searchLabelText,
  setValue,
  value,
}) => {
  return (
    <DocumentFormAutoComplete
      autoCompleteSearch={
        <SearchBar
          isValueForced={isValueForced}
          searchLabelText={searchLabelText}
          setValue={setValue}
          value={value}
        />
      }
      getValueName={getOrganizationToString}
      hasError={false} // How to check for errors ?
      helperContent={
        isValueForced ? helperContentIfValueIsForced : helperContent
      }
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
      value={value}
    />
  );
};

SearchBar.propTypes = {
  isValueForced: PropTypes.bool.isRequired,
  searchLabelText: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
};
OrganizationAutoComplete.propTypes = {
  isValueForced: PropTypes.bool.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.shape({}),
};

export default OrganizationAutoComplete;
