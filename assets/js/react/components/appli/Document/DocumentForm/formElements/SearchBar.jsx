import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { length, pathOr } from 'ramda';

import { useDebounce } from '../../../../../hooks';

import { DocumentFormContext } from '../Provider';

import AutoCompleteSearchComponent from '../../../../common/AutoCompleteSearch';
import { AutoCompleteSearchTypes } from '../../../../common/AutoCompleteSearch/types';

// ===================================

const SearchBar = (props) => {
  const {
    contextValueName,
    fetchSearchResults,
    getValueName,
    resetSearchResults,
    inputValue: defaultInputValue = '',
  } = props;
  const {
    docAttributes: { [contextValueName]: value, partOf },
    updateAttribute,
  } = useContext(DocumentFormContext);
  const [inputValue, setInputValue] = React.useState(defaultInputValue);
  const debouncedInput = useDebounce(inputValue);
  const handleInputChange = (newValue) => {
    if (value && getValueName(value) === newValue) {
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const isValueForced = pathOr(null, [contextValueName], partOf) !== null;

  const handleSelection = (newValue) => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (newValue !== null) {
      updateAttribute(contextValueName, newValue);

      if (contextValueName === 'partOf') {
        updateAttribute('editor', pathOr(null, ['editor'], newValue));
        updateAttribute('library', pathOr(null, ['library'], newValue));
      }
    }
    setInputValue('');
  };

  useEffect(() => {
    setInputValue(defaultInputValue);
  }, [defaultInputValue]);

  useEffect(() => {
    if (length(debouncedInput) > 2) {
      fetchSearchResults(debouncedInput);
    } else {
      resetSearchResults();
    }
  }, [debouncedInput]);

  return (
    <AutoCompleteSearchComponent
      disabled={isValueForced}
      isValueForce={isValueForced}
      onInputChange={handleInputChange}
      onSelection={handleSelection}
      {...props}
      inputValue={inputValue}
    />
  );
};

const SearchBarInheritedProps = AutoCompleteSearchTypes;
delete SearchBarInheritedProps.disabled;
delete SearchBarInheritedProps.isValueForced;
delete SearchBarInheritedProps.onInputChange;
delete SearchBarInheritedProps.onSelection;

SearchBar.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  fetchSearchResults: PropTypes.func.isRequired,
  getValueName: PropTypes.func.isRequired,
  resetSearchResults: PropTypes.func.isRequired,
  ...SearchBarInheritedProps,
  inputValue: PropTypes.string,
};

export default SearchBar;
