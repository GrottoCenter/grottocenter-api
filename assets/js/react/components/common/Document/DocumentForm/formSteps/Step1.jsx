import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import LanguageSelect from '../formElements/LanguageSelect';
import StringInput from '../formElements/StringInput';
import TitleEditor from '../formElements/TitleEditor';

// ===================================
const FlexContainer = styled.div`
  display: flex;
`;
// ===================================

const DocumentForm = ({
  allLanguages,
  // Doc attributes
  documentMainLanguage,
  identifier,
  reference,
  title,
  titleLanguage,
  // onChange functions
  onDocumentMainLanguageChange,
  onIdentifierChange,
  onReferenceChange,
  onTitleChange,
  onTitleLanguageChange,

  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    const newIsValid =
      documentMainLanguage !== '' && title !== '' && titleLanguage !== '';
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
      onStepIsValidChange(stepId, newIsValid);
    }
  });

  return (
    <>
      <LanguageSelect
        allLanguages={allLanguages}
        itemReferringTo="Document"
        helperText="Some helper text for Document Main Language"
        language={documentMainLanguage}
        onLanguageChange={onDocumentMainLanguageChange}
        required
      />

      <TitleEditor
        allLanguages={allLanguages}
        title={title}
        onTitleChange={onTitleChange}
        language={titleLanguage}
        languageHelperText="Some helper text for Title Language"
        languageItemReferringTo="Title"
        onLanguageChange={onTitleLanguageChange}
      />

      <FlexContainer>
        <StringInput
          helperText="Some helper text for Reference"
          onValueChange={onReferenceChange}
          value={reference}
          valueName="Reference"
        />
        <StringInput
          helperText="Some helper text for Identifier"
          onValueChange={onIdentifierChange}
          value={identifier}
          valueName="Identifier"
        />
      </FlexContainer>
    </>
  );
};

DocumentForm.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,

  // Document attributes
  documentMainLanguage: PropTypes.string.isRequired,
  identifier: PropTypes.string.isRequired,
  reference: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  titleLanguage: PropTypes.string.isRequired,

  // On change functions
  onDocumentMainLanguageChange: PropTypes.func.isRequired,
  onIdentifierChange: PropTypes.func.isRequired,
  onReferenceChange: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onTitleLanguageChange: PropTypes.func.isRequired,

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default DocumentForm;
