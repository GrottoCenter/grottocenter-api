import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AddCircle from '@material-ui/icons/AddCircle';
import PropTypes from 'prop-types';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../../../actions/Quicksearch';

import Translate from '../../../components/common/Translate';

import MultipleSelectComponent from '../../../components/appli/Document/DocumentForm/formElements/MultipleSelect';

import { entityOptionForSelector } from '../../../helpers/Entity';
import CreateNewCaver from './CreateNewCaver';
import { useBoolean } from '../../../hooks';

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

  const { isTrue: actionEnabled, true: enableAction } = useBoolean();
  const { isOpen: isCreateCaverOpen, toggle: toggleCreateCaver } = useBoolean();
  const [defaultNewName, setDefaultNewName] = useState('');

  const loadSearchResults = (inputValue) => {
    dispatch(
      fetchQuicksearchResult({
        query: inputValue,
        resourceTypes: ['cavers'],
        complete: false,
      }),
    );
    setDefaultNewName(inputValue);
  };
  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  useEffect(() => {
    if (isLoading) {
      enableAction();
    }
  }, [isLoading]);

  const handleOpenSideAction = () => {
    toggleCreateCaver();
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
      sideActionDisabled={!actionEnabled}
      sideActionIcon={<AddCircle fontSize="large" />}
      isSideActionOpen={isCreateCaverOpen}
      onSideAction={handleOpenSideAction}
    >
      <CreateNewCaver
        contextValueName={contextValueName}
        enabled={isCreateCaverOpen}
        onCreateSuccess={toggleCreateCaver}
        defaultName={defaultNewName}
        defaultSurname=""
      />
    </MultipleSelectComponent>
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
