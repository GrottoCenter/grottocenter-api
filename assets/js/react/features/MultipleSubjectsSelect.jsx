import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import Translate from '../components/common/Translate';
import { loadSubjectsSearch, resetSubjectsSearch } from '../actions/Subject';

import MultipleSelectComponent from '../components/appli/Document/DocumentForm/formElements/MultipleSelect';

const MultipleSubjectsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false,
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const {
    errors: searchErrors,
    isFetching,
    searchedSubjects: searchResults,
  } = useSelector((state) => state.subject);

  const loadSearchResults = (inputValue) => {
    dispatch(loadSubjectsSearch(inputValue, inputValue));
  };
  const resetSearchResults = () => {
    dispatch(resetSubjectsSearch());
  };

  return (
    <MultipleSelectComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionLabel={(option) => {
        const { code } = option;
        const subjectName = formatMessage({
          id: option.code,
          defaultMessage: option.subject,
        });
        let parentText = '';
        if (option.parent) {
          const parentCode = option.parent ? option.parent.code : '';
          const parentSubjectName = formatMessage({
            id: option.parent.code,
            defaultMessage: option.parent.subject,
          });
          parentText = `${parentCode} ${parentSubjectName} -`;
        }
        return `${parentText} ${code} ${subjectName}`;
      }}
      getOptionSelected={(optionToTest, valueToTest) =>
        optionToTest.code === valueToTest.code
      }
      helperText={helperText}
      isLoading={isFetching}
      labelName={labelName}
      loadSearchResults={loadSearchResults}
      nbCharactersNeededToLaunchSearch={3}
      noOptionsText={
        <Translate>No subject matches you search criteria</Translate>
      }
      required={required}
      resetSearchResults={resetSearchResults}
      searchErrors={searchErrors}
      searchResults={searchResults}
    />
  );
};

MultipleSubjectsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default MultipleSubjectsSelect;
