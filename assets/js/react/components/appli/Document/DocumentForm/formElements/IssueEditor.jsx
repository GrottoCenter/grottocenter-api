import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';

import StringInput from '../../../../common/Form/StringInput';

// ===================================

const IssueEditor = ({ helperText, valueName, required = false }) => {
  const {
    docAttributes: { issue },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const onValueChange = (newValue) => {
    updateAttribute('issue', newValue);
  };

  return (
    <StringInput
      helperText={helperText}
      multiline={false}
      onValueChange={onValueChange}
      required={required}
      value={issue}
      valueName={valueName}
    />
  );
};

IssueEditor.propTypes = {
  helperText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  valueName: PropTypes.string.isRequired,
};

export default IssueEditor;
