import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import Translate from '../components/common/Translate';
import MultipleSelect from '../components/common/Form/MultipleSelect';
import { loadBBSRegionsByName, resetBBSRegionsByName } from '../actions/Region';

const MultipleBBSRegionsSelect = ({
  computeHasError,
  getOptionLabel,
  helperText,
  labelName,
  required = false,
  setValue,
  value,
}) => {
  const dispatch = useDispatch();
  const { errors, isFetching, bbsRegionsByName: searchResults } = useSelector(
    (state) => state.region,
  );

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        setValue('');
        break;
      case 'select-option':
      case 'remove-option':
        setValue(newValue);
        break;
      default:
    }
  };

  const loadSearchResults = (inputValue) => {
    dispatch(loadBBSRegionsByName(inputValue));
  };
  const resetSearchResults = () => {
    dispatch(resetBBSRegionsByName());
  };

  const hasError = computeHasError(value);
  const memoizedValues = [searchResults, hasError, value];
  return useMemo(
    () => (
      <>
        <MultipleSelect
          computeHasError={computeHasError}
          getOptionLabel={getOptionLabel}
          handleOnChange={handleOnChange}
          helperText={helperText}
          isLoading={isFetching}
          labelName={labelName}
          loadSearchResults={loadSearchResults}
          nbCharactersNeededToLaunchSearch={3}
          noOptionsText={
            <Translate>No region matches you search criteria</Translate>
          }
          required={required}
          resetSearchResults={resetSearchResults}
          searchErrors={errors}
          searchResults={searchResults}
          value={value}
        />
      </>
    ),
    [memoizedValues],
  );
};

MultipleBBSRegionsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
  setValue: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default MultipleBBSRegionsSelect;
