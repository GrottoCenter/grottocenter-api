import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {
  Fade,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';

import Translate from '../../../Translate';

import { isImage } from '../DocumentTypesHelper';
import StringInput from './StringInput';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const IdentifierContainer = styled.div`
  flex: 12;
  min-width: 300px;
`;

const IdentifierTypeContainer = styled.div`
  flex: 5;
  min-width: 200px;
`;
// ===================================

const IdentifierEditor = ({
  allIdentifierTypes,
  documentType,
  identifier,
  identifierType,
  onIdentifierChange,
  onIdentifierTypeChange,
}) => {
  const handleIdentifierChange = (newIdentifier) => {
    if (newIdentifier === '') {
      onIdentifierTypeChange({ id: '', text: '' });
    }
    onIdentifierChange(newIdentifier);
  };
  const handleIdentifierTypeChange = (event) => {
    const idType = allIdentifierTypes.find(
      (idT) => idT.id === event.target.value,
    );
    onIdentifierTypeChange({
      id: idType.id,
      text: idType.text,
    });
  };

  const memoizedValues = [documentType, identifier, identifierType];
  return useMemo(
    () => (
      <InlineWrapper>
        <IdentifierContainer>
          <StringInput
            helperText="Unique identifier of the document. It can be a DOI, an URL, an ISBN or an ISSN."
            onValueChange={handleIdentifierChange}
            value={identifier}
            valueName="Identifier"
            required={false}
            hasError={false}
          />
        </IdentifierContainer>

      {identifier !== '' && (
        <Fade in={identifier !== ''}>
          <IdentifierTypeContainer>
            <FormControl
              variant="filled"
              required={!isImage(documentType) && identifier !== ''}
              fullWidth
              error={!isImage(documentType) && identifierType.id === ''} // TODO
            >
              <InputLabel htmlFor="identifier-type">
                <Translate>Identifier Type</Translate>
              </InputLabel>
              <Select
                value={identifierType.id}
                onChange={handleIdentifierTypeChange}
                inputProps={{
                  id: `identifier-type`,
                  name: `identifier-type`,
                }}
              >
                <MenuItem key={-1} value={-1} disabled>
                  <Translate>Select an Identifier Type.</Translate>
                </MenuItem>
                {allIdentifierTypes.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.text}
                  </MenuItem>
                ))}
              </Select>

              <FormHelperText>
                <Translate>Some helper text for Identifier Type.</Translate>
              </FormHelperText>
            </FormControl>
          </IdentifierTypeContainer>
        </Fade>
      )}
    </InlineWrapper>
  );
};

IdentifierEditor.propTypes = {
  allIdentifierTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ),
  documentType: PropTypes.number.isRequired,
  identifier: PropTypes.string.isRequired,
  identifierType: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }),
  onIdentifierChange: PropTypes.func.isRequired,
  onIdentifierTypeChange: PropTypes.func.isRequired,
};

export default IdentifierEditor;
