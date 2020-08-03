import React, { useContext, useMemo } from 'react';
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

import AutoCompleteSearch from '../../../../common/AutoCompleteSearch';
import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';
import { isCollection } from '../DocumentTypesHelper';
import { allPartOf } from '../stories/documentFormFakeData';

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

const PartOfAutoComplete = ({ hasError, partOfSuggestions, required }) => {
  const [partOfInputTmp, setPartOfInputTmp] = React.useState('');
  const { formatMessage } = useIntl();
  const {
    docAttributes: { partOf },
    updateAttribute,
  } = useContext(DocumentFormContext);

  /**
   * Recursive function to build the complete name of a "part" element
   * from all its parents and children.
   * @param part : element to build the name
   * @param childPart : previously child part name computed
   *
   * Ex:
   * If myArticle is from a Spelunca issue,
   * getIsPartOfName(myArticle, '') will return:
   * Spelunca [COLLECTION] > Spelunca n°142 > "the title of myArticle"
   */
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
          fullWidth
        >
          <InputLabel>
            <Translate>Parent document</Translate>
          </InputLabel>
          <PartOfInput
            disabled
            value={partOf ? getIsPartOfName(partOf) : ''}
            endAdornment={
              <InputAdornment position="end">
                <img
                  src="/images/link.png"
                  alt="Link icon"
                  style={{ width: '35px' }}
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
    ),
    [memoizedValues],
  );
};

PartOfAutoComplete.propTypes = {
  hasError: PropTypes.bool.isRequired,
  partOfSuggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      issue: PropTypes.string,
    }),
  ),
  required: PropTypes.bool.isRequired,
};

export default PartOfAutoComplete;
