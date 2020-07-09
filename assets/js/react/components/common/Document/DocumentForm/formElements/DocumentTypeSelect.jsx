import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import Translate from '../../../Translate';

import { DocumentFormContext } from '../Provider';

// ===================================

const DocumentTypeSelect = ({
  allDocumentTypes,
  helperText,
  required = false,
}) => {
  const {
    docAttributes: { documentType },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const handleChange = (event, child) => {
    const newDocType = {
      id: event.target.value,
      name: child.props.name,
    };
    updateAttribute('documentType', newDocType);
  };

  const memoizedValues = [allDocumentTypes, documentType];
  return useMemo(
    () => (
      <FormControl variant="filled" required={required} fullWidth>
        <InputLabel htmlFor="document-type">
          <Translate>Document Type</Translate>
        </InputLabel>
        <Select
          defaultValue={-1}
          value={documentType === null ? -1 : documentType.id}
          onChange={handleChange}
          inputProps={{
            id: `document-type`,
            name: `document-type`,
          }}
        >
          <MenuItem key={-1} value={-1} name="Undefined" disabled>
            <i>
              <Translate>Select a document type</Translate>
            </i>
          </MenuItem>
          {allDocumentTypes.map((t) => (
            <MenuItem key={t.id} value={t.id} name={t.name}>
              <Translate>{t.name}</Translate>
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <FormHelperText>
            <Translate>{helperText}</Translate>
          </FormHelperText>
        )}
      </FormControl>
    ),
    memoizedValues,
  );
};

DocumentTypeSelect.propTypes = {
  allDocumentTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  helperText: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default DocumentTypeSelect;
