import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { isEmpty, isNil } from 'ramda';
import { InputAdornment } from '@material-ui/core';
import AddCircle from '@material-ui/icons/AddCircle';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../../../actions/Quicksearch';

import { entityOptionForSelector } from '../../../helpers/Entity';

import SearchBar from '../../../components/appli/Document/DocumentForm/formElements/SearchBar';
import FormAutoComplete from '../FormAutoComplete';
import { useBoolean } from '../../../hooks';
import CreateNewOrganization from './CreateNewOrganization';

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

const OrganizationAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  searchLabelText,
}) => {
  const [defaultSearchValue, setDefaultSearchValue] = useState('');
  const [
    defaultNewOrganizationValue,
    setDefaultNewOrganizationValue,
  ] = useState('');
  const { isTrue: actionEnabled, true: enableAction } = useBoolean();
  const {
    isOpen: isCreateOrganizationOpen,
    toggle: toggleCreateOrganization,
  } = useBoolean();
  const dispatch = useDispatch();
  const { error, isLoading, results: suggestions } = useSelector(
    (state) => state.quicksearch,
  );

  const fetchSearchResults = (debouncedInput) => {
    const criteria = {
      query: debouncedInput.trim(),
      complete: false,
      resourceType: 'grottos',
    };
    setDefaultNewOrganizationValue(debouncedInput);
    dispatch(fetchQuicksearchResult(criteria));
  };

  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  useEffect(() => {
    if (isLoading && !isEmpty(defaultNewOrganizationValue)) {
      enableAction();
    }
  }, [isLoading, defaultNewOrganizationValue]);

  const handleOpenSideAction = () => {
    setDefaultSearchValue('');
    toggleCreateOrganization();
  };

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <SearchBar
          fetchSearchResults={fetchSearchResults}
          getOptionLabel={getOrganizationToString}
          getValueName={getOrganizationToString}
          hasError={!isNil(error)}
          isLoading={isLoading}
          label={searchLabelText}
          renderOption={entityOptionForSelector}
          resetSearchResults={resetSearchResults}
          searchLabelText={searchLabelText}
          suggestions={suggestions}
          contextValueName={contextValueName}
          resourceSearchedType="grottos"
          inputValue={defaultSearchValue}
        />
      }
      contextValueName={contextValueName}
      getValueName={getOrganizationToString}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
      sideActionDisabled={!actionEnabled}
      sideActionIcon={<AddCircle fontSize="large" />}
      onSideAction={handleOpenSideAction}
      isSideActionOpen={isCreateOrganizationOpen}
    >
      <CreateNewOrganization
        contextValueName={contextValueName}
        enabled={isCreateOrganizationOpen}
        onCreateSuccess={toggleCreateOrganization}
        defaultValue={defaultNewOrganizationValue}
      />
    </FormAutoComplete>
  );
};

OrganizationAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired,
};

export default OrganizationAutoComplete;
