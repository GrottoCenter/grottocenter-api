import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { InputAdornment } from '@material-ui/core';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../../actions/Quicksearch';

import { entityOptionForSelector } from '../../helpers/Entity';

import { isCollection } from '../../components/appli/Document/DocumentForm/DocumentTypesHelper';

import SearchBar from '../../components/appli/Document/DocumentForm/formElements/SearchBar';
import FormAutoComplete from './FormAutoComplete';

// ===================================

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src="/images/bibliography.svg"
      alt="Document icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

// ===================================

const DocumentAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  resourceTypes = ['documents'],
  searchLabelText,
}) => {
  const dispatch = useDispatch();
  const { error, isLoading, results: suggestions } = useSelector(
    (state) => state.quicksearch,
  );

  const { formatMessage } = useIntl();

  /**
   * Recursive function to build the complete name of a "part" element
   * from all its parents and children.
   * @param part : element to build the name
   * @param childPart : previously child part name computed
   *
   * Ex:
   * If myArticle is from a Spelunca issue,
   * getPartOfName(myArticle, '') will return:
   * Spelunca [COLLECTION] > Spelunca n°142 > "the title of myArticle"
   */
  const getPartOfName = (part, childPart = '') => {
    const conditionalChildPart = childPart === '' ? '' : `> ${childPart}`;

    // If the item is a Collection without child, display [COLLECTION] indicator
    const conditionalNamePart =
      isCollection(part.documentType) && childPart === ''
        ? `${part.name} [${formatMessage({ id: 'COLLECTION' })}]`
        : part.name;

    if (!part.partOf) {
      return `${conditionalNamePart} ${
        part.issue ? part.issue : ''
      } ${conditionalChildPart}`;
    }
    return getPartOfName(
      part.partOf,
      `${conditionalNamePart} ${part.issue} ${conditionalChildPart}`,
    );
  };

  const fetchSearchResults = (debouncedInput) => {
    const criterias = {
      query: debouncedInput.trim(),
      complete: false,
      resourceTypes,
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
          getOptionLabel={getPartOfName}
          getValueName={getPartOfName}
          hasError={!isNil(error)}
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
      getValueName={getPartOfName}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
    />
  );
};

DocumentAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  resourceTypes: PropTypes.arrayOf(
    PropTypes.oneOf(['documents', 'document-collections', 'document-issues']),
  ),

  searchLabelText: PropTypes.string.isRequired,
};

export default DocumentAutoComplete;
