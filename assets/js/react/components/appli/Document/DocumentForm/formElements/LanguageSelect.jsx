import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import LanguageIcon from '@material-ui/icons/Translate';
import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

// ===================================

const LanguageSelect = ({
  allLanguages,
  contextValueNameToUpdate,
  helperText,
  itemReferringTo,
  required = false,
}) => {
  const context = useContext(DocumentFormContext);
  const { updateAttribute } = context;
  const language = context.docAttributes[contextValueNameToUpdate];

  const handleChange = (event, child) => {
    const newLanguage = {
      id: event.target.value,
      name: child.props.name,
    };
    updateAttribute(contextValueNameToUpdate, newLanguage);
  };

  const memoizedValues = [allLanguages, language];
  return useMemo(
    () => (
      <FormControl
        variant="filled"
        required={required}
        fullWidth
        error={required && language === null}
      >
        <InputLabel htmlFor={`${itemReferringTo}-language`}>
          <LanguageIcon style={{ verticalAlign: 'middle' }} />
          <Translate>{`${itemReferringTo} Language`}</Translate>
        </InputLabel>

        <Select
          value={language === null ? -1 : language.id}
          onChange={handleChange}
          inputProps={{
            name: `${itemReferringTo}-language`,
            id: `${itemReferringTo}-language`,
          }}
        >
          <MenuItem key={-1} value={-1} disabled>
            <i>
              <Translate>Select a language</Translate>
            </i>
          </MenuItem>
          {allLanguages.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              <Translate>{l.name}</Translate>
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

LanguageSelect.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  contextValueNameToUpdate: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  itemReferringTo: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default LanguageSelect;
