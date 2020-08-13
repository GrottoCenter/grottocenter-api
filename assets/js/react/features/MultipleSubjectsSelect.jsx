import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import Translate from '../components/common/Translate';
import { loadSubjectsSearch, resetSubjectsSearch } from '../actions/Subject';
import MultipleSelect from '../components/common/Form/MultipleSelect';

const MultipleSubjectsSelect = ({
  computeHasError,
  helperText,
  labelName,
  required = false,
  setValue,
  value,
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const {
    errors: searchErrors,
    isFetching,
    searchedSubjects: searchResults,
  } = useSelector((state) => state.subject);

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        setValue([]);
        break;
      case 'select-option':
      case 'remove-option':
        setValue(newValue);
        break;
      default:
    }
  };

  const loadSearchResults = (inputValue) => {
    dispatch(loadSubjectsSearch(inputValue, inputValue));
  };
  const resetSearchResults = () => {
    dispatch(resetSubjectsSearch());
  };

  const hasError = computeHasError(value);
  const memoizedValues = [searchResults, hasError, value];
  return useMemo(
    () => (
      <MultipleSelect
        computeHasError={computeHasError}
        getOptionLabel={(option) => {
          const { code } = option;
          const subjectName = formatMessage({
            id: option.code,
            defaultMessage: option.subject,
          });
          return `${code} ${subjectName}`;
        }}
        getOptionSelected={(optionToTest, valueToTest) =>
          optionToTest.code === valueToTest.code
        }
        handleOnChange={handleOnChange}
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
        value={value}
      />
    ),
    [memoizedValues],
  );
};

MultipleSubjectsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default MultipleSubjectsSelect;
