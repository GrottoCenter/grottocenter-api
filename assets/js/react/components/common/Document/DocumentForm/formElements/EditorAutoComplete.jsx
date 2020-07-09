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
const EditorInput = styled(FilledInput)`
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

const EditorAutoComplete = ({ editorSuggestions, hasError, required }) => {
  const [editorInputTmp, setEditorInputTmp] = React.useState('');
  const {
    docAttributes: { editor: ownEditor, partOf },
    updateAttribute,
  } = useContext(DocumentFormContext);
  const parentEditor = pathOr(null, ['editor'], partOf);

  let editor = null;
  if (parentEditor !== null) {
    editor = parentEditor;
  } else {
    editor = ownEditor;
  }

  const handleInputChange = (value) => {
    if (editor && editor.name === value) {
      setEditorInputTmp('');
    } else {
      setEditorInputTmp(value);
    }
  };
  const handleEditorSelection = (value) => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (value !== null) {
      updateAttribute('editor', value);
    }
    setEditorInputTmp('');
  };

  const memoizedValues = [editor, editorSuggestions, hasError];
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
            <Translate>Editor</Translate>
          </InputLabel>
          <EditorInput
            disabled
            value={editor !== null ? editor.name : ''}
            endAdornment={
              <InputAdornment position="end">
                <img
                  src="/images/bibliography.svg"
                  alt="Bibliography icon"
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
              onSelection={handleEditorSelection}
              label={
                parentEditor !== null
                  ? 'Editor deduced from parent'
                  : 'Search for an Editor...'
              }
              inputValue={editorInputTmp}
              onInputChange={handleInputChange}
              suggestions={editorSuggestions}
              renderOption={(option) => `${option.id} - ${option.name}`}
              getOptionLabel={(option) => option.name}
              hasError={false} // TODO ?
              isLoading={false} // TODO
              disabled={parentEditor !== null}
            />
          </StyledFormControl>

          <FormHelperText>
            <Translate>
              Use the search bar above to find an existing editor.
            </Translate>
          </FormHelperText>
        </FormControl>
      </>
    ),
    [memoizedValues],
  );
};

EditorAutoComplete.propTypes = {
  editorSuggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  hasError: PropTypes.bool.isRequired,
  required: PropTypes.bool.isRequired,
};

export default EditorAutoComplete;
