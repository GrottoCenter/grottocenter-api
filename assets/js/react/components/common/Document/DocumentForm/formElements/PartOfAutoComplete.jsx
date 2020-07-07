import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
} from '@material-ui/core';
import { pathOr } from 'ramda';

import AutoCompleteSearch from '../../../AutoCompleteSearch';

import Translate from '../../../Translate';
import { isCollection } from '../DocumentTypesHelper';

// ===================================
const PartOfInput = styled(FilledInput)`
  ${({ theme }) => `
  color: ${theme.palette.primaryTextColor} !important;
  `}
`;

const StyledFormControl = styled(FormControl)`
  ${({ theme }) => `
  background-color: ${theme.palette.primary3Color};
  `}
`;
// ===================================

const PartOfAutoComplete = ({
  hasError,
  onPartOfChange,
  partOf,
  partOfSuggestions,
  required,
}) => {
  const [partOfInputTmp, setPartOfInputTmp] = React.useState('');
  const { formatMessage } = useIntl();

  const getIsPartOfName = (part, childPart = '') => {
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
    return getIsPartOfName(
      part.partOf,
      `${conditionalNamePart} ${part.issue} ${conditionalChildPart}`,
    );
  };

  const handleInputChange = (value) => {
    if (partOf && value === getIsPartOfName(partOf)) {
      setPartOfInputTmp('');
    } else {
      setPartOfInputTmp(value);
    }
  };

  const handlePartOfSelection = (newValue) => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (newValue !== null) {
      updateAttribute('partOf', newValue);
      updateAttribute('editor', pathOr(null, ['editor'], newValue));
      updateAttribute('library', pathOr(null, ['library'], newValue));
    }
    setPartOfInputTmp('');
  };

  const memoizedValues = [allPartOf, hasError, partOf];
  return useMemo(
    () => (
      <>
        <FormControl
          variant="filled"
          required={required}
          error={hasError}
        >
          <AutoCompleteSearch
            onSelection={handlePartOfSelection}
            label="Search for a document..."
            inputValue={partOfInputTmp}
            onInputChange={handleInputChange}
            suggestions={partOfSuggestions}
            renderOption={(option) => getIsPartOfName(option)}
            getOptionLabel={(option) => getIsPartOfName(option)}
            hasError={false} // TODO ?
            isLoading={false} // TODO
          />
        </StyledFormControl>

        <FormHelperText>
          <Translate>
            Use the search bar to search for an existing document.
          </Translate>
        </FormHelperText>
      </FormControl>
    </>
  );
};

PartOfAutoComplete.propTypes = {
  hasError: PropTypes.bool.isRequired,
  onPartOfChange: PropTypes.func.isRequired,
  partOfSuggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      issue: PropTypes.string,
    }),
  ),
  partOf: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  required: PropTypes.bool.isRequired,
};

export default PartOfAutoComplete;
