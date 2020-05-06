import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, FormControl, Typography } from '@material-ui/core';

import Translate from '../../Translate';

import IsFromBBSSwitch from './IsFromBBSSwitch';
import LanguageSelect from './LanguageSelect';
import PublicationDatePicker from './PublicationDatePicker';
import StringInput from './StringInput';
import TitleEditor from './TitleEditor';

// ===================================
const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
`;

const SubmitButton = styled(Button)`
  display: block;
  margin: auto;
`;

const FlexContainer = styled.div`
  display: flex;
`;
// ===================================

const DocumentForm = ({
  description,
  documentLanguage,
  identifier,
  isFromBbs,
  issue,
  onDescriptionChange,
  onDocumentLanguageChange,
  onIdentifierChange,
  onIsFromBbsChange,
  onIssueChange,
  onPublicationDateChange,
  onReferenceChange,
  onSubmit,
  onTitleChange,
  onTitleLanguageChange,
  publicationDate,
  reference,
  title,
  titleLanguage,
}) => {
  return (
    <>
      <Typography variant="h1">
        <Translate>Document Submission form</Translate>
      </Typography>
      <FormWrapper onSubmit={onSubmit}>
        <TitleEditor
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

        <StringInput
          helperText="Some helper text for Issue"
          onValueChange={onIssueChange}
          value={issue}
          valueName="Issue"
        />

        <LanguageSelect
          itemReferringTo="Document"
          helperText="Some helper text for Document Language"
          language={documentLanguage}
          onLanguageChange={onDocumentLanguageChange}
          required
        />

        <PublicationDatePicker
          publicationDate={publicationDate}
          onPublicationDateChange={onPublicationDateChange}
        />

        <IsFromBBSSwitch
          isFromBbs={isFromBbs}
          onIsFromBbsChange={onIsFromBbsChange}
        />
        <StringInput
          helperText="Some helper text for Description"
          onValueChange={onDescriptionChange}
          value={description}
          valueName="Description"
          multiline
        />
        <FormControl>
          <SubmitButton type="submit" variant="contained" size="large">
            <Translate>Submit</Translate>
          </SubmitButton>
        </FormControl>
      </FormWrapper>
    </>
  );
};

DocumentForm.propTypes = {
  description: PropTypes.string.isRequired,
  documentLanguage: PropTypes.string.isRequired,
  identifier: PropTypes.string.isRequired,
  isFromBbs: PropTypes.bool.isRequired,
  issue: PropTypes.string.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onDocumentLanguageChange: PropTypes.func.isRequired,
  onIdentifierChange: PropTypes.func.isRequired,
  onIsFromBbsChange: PropTypes.func.isRequired,
  onIssueChange: PropTypes.func.isRequired,
  onPublicationDateChange: PropTypes.func.isRequired,
  onReferenceChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onTitleLanguageChange: PropTypes.func.isRequired,
  publicationDate: PropTypes.instanceOf(Date),
  reference: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  titleLanguage: PropTypes.string.isRequired,
};

export default DocumentForm;
