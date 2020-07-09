import React, { useContext, useMemo } from 'react';
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

import { DocumentFormContext } from '../Provider';

// ===================================
const LibraryInput = styled(FilledInput)`
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

const LibraryAutoComplete = ({ librarySuggestions, hasError, required }) => {
  const [libraryInputTmp, setLibraryInputTmp] = React.useState('');
  const {
    docAttributes: { library: ownLibrary, partOf },
    updateAttribute,
  } = useContext(DocumentFormContext);
  const parentLibrary = pathOr(null, ['library'], partOf);

  let library = null;
  if (parentLibrary !== null) {
    library = parentLibrary;
  } else {
    library = ownLibrary;
  }

  const handleInputChange = (value) => {
    if (library && library.name === value) {
      setLibraryInputTmp('');
    } else {
      setLibraryInputTmp(value);
    }
  };
  const handleLibrarySelection = (value) => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (value !== null) {
      updateAttribute('library', value);
    }
    setLibraryInputTmp('');
  };

  const memoizedValues = [library, librarySuggestions, hasError];
  return useMemo(
    () => (
      <>
        <FormControl
          variant="filled"
          required={required}
          error={hasError}
          fullWidth
        >
          <InputLabel>
            <Translate>Library</Translate>
          </InputLabel>
          <LibraryInput
            disabled
            value={library !== null ? library.name : ''}
            endAdornment={
              <InputAdornment position="end">
                <img
                  src="/images/club.svg"
                  alt="Club icon"
                  style={{ width: '40px' }}
                />
              </InputAdornment>
            }
          />

          <StyledFormControl
            variant="filled"
            required={required}
            error={hasError}
          >
            <AutoCompleteSearch
              onSelection={handleLibrarySelection}
              label={
                parentLibrary !== null
                  ? 'Library deduced from parent'
                  : 'Search for a Library...'
              }
              inputValue={libraryInputTmp}
              onInputChange={handleInputChange}
              suggestions={librarySuggestions}
              renderOption={(option) => `${option.id} - ${option.name}`}
              getOptionLabel={(option) => option.name}
              hasError={false} // TODO ?
              isLoading={false} // TODO
              disabled={parentLibrary !== null}
            />
          </StyledFormControl>

          <FormHelperText>
            <Translate>
              Where the document is physicially stored. Use the search bar above
              to find an existing library.
            </Translate>
          </FormHelperText>
        </FormControl>
      </>
    ),
    [memoizedValues],
  );
};

LibraryAutoComplete.propTypes = {
  librarySuggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  hasError: PropTypes.bool.isRequired,
  required: PropTypes.bool.isRequired,
};

export default LibraryAutoComplete;
