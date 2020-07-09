import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Fade } from '@material-ui/core';

import DescriptionEditor from '../formElements/DescriptionEditor';
import DocumentTypeSelect from '../formElements/DocumentTypeSelect';
import LanguageSelect from '../formElements/LanguageSelect';
import MultipleSelect from '../formElements/MultipleSelect';
import PublicationDatePicker from '../formElements/PublicationDatePicker';
import TitleEditor from '../formElements/TitleEditor';

import {
  allDocumentTypes,
  isCollection,
  isCollectionElement,
  isImage,
  isText,
} from '../DocumentTypesHelper';

// ===================================
const FlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const FlexItemWrapper = styled.div`
  flex: 1;
`;

const TitleEditorWrapper = styled.div`
  flex: 8;
  flex-basis: 600px;
`;

const PublicationDateWrapper = styled.div`
  flex: 1;
  flex-basis: 350px;
`;
// ===================================

const DocumentForm = ({
  allAuthors,
  allLanguages,
  allSubjects,
  // Doc attributes
  authors,
  description,
  descriptionLanguage,
  documentMainLanguage,
  documentType,
  publicationDate,
  subjects,
  title,
  titleLanguage,
  // onChange functions
  onAuthorsChange,
  onDescriptionChange,
  onDescriptionLanguageChange,
  onDocumentMainLanguageChange,
  onDocumentTypeChange,
  onPublicationDateChange,
  onSubjectsChange,
  onTitleChange,
  onTitleLanguageChange,

  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    // Common validation (title and description)
    let newIsValid =
      title !== '' &&
      titleLanguage !== '' &&
      description !== '' &&
      descriptionLanguage !== '';

    // Specific validations
    if (documentType === null) {
      newIsValid = false;
    } else if (isCollection(documentType)) {
      // nothing to do
    } else if (isCollectionElement(documentType)) {
      newIsValid = newIsValid && publicationDate !== null;
    } else if (isText(documentType)) {
      newIsValid = newIsValid && authors.length > 0 && subjects.length > 0;
    } else if (isImage(documentType)) {
      newIsValid = newIsValid && authors.length > 0;
    }

    // Lazy state change
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
      onStepIsValidChange(stepId, newIsValid);
    }
  });

  /**
   * Performance improvement to avoid useless re-rendering
   * Step1 needs to re-render only if :
   * - it becomes valid
   * - the DocumentType changes
   */
  const memoizedValues = [documentType, isValid];
  return useMemo(
    () => (
      <>
        <FlexWrapper>
          <FlexItemWrapper>
            <DocumentTypeSelect
              allDocumentTypes={allDocumentTypes}
              helperText="For example, a magazine is a Collection, an article from a magazine is a Collection Element."
              required
            />
          </FlexItemWrapper>
          <FlexItemWrapper>
            <LanguageSelect
              allLanguages={allLanguages}
              itemReferringTo="Document Main"
              helperText="Main language of the document"
              contextValueNameToUpdate="documentMainLanguage"
            />
          </FlexItemWrapper>
        </FlexWrapper>

        <Fade in={documentType !== null}>
          <div>
            {documentType !== null && (
              <>
                <FlexWrapper>
                  <TitleEditorWrapper>
                    <TitleEditor
                      allLanguages={allLanguages}
                      languageHelperText="Language of the title. You will be able to add more translations of the title later."
                      languageItemReferringTo="Title"
                      required
                    />
                  </PublicationDateWrapper>
                )}
              </FlexWrapper>

                <DescriptionEditor
                  allLanguages={allLanguages}
                  languageHelperText="Language of the description you provided."
                  languageItemReferringTo="Description"
                  required
                />

              <MultipleSelect
                allPossibleValues={allAuthors}
                getOptionLabel={(option) => `${option.name} ${option.surname}`}
                hasError={
                  (isImage(documentType) || isText(documentType)) &&
                  authors.length === 0
                }
                helperText="Use authors' full name, no abreviation. In a next version of the website, if the author is not in the Grottocenter database, you will be able to add it."
                labelName="Authors"
                onValuesChange={onAuthorsChange}
                required={isText(documentType) || isImage(documentType)}
                value={authors}
              />

              <MultipleSelect
                allPossibleValues={allSubjects}
                getOptionLabel={(option) => `${option.id} ${option.subject}`}
                hasError={isText(documentType) && subjects.length === 0}
                helperText="Be precise about the subjects discussed in the document: there are plenty of subject choices in Grottocenter."
                labelName="Subjects"
                onValuesChange={onSubjectsChange}
                required={isText(documentType)}
                value={subjects}
              />
            </>
          )}
        </div>
      </Fade>
    </>
  );
};

DocumentForm.propTypes = {
  allAuthors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ).isRequired,
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  allSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ).isRequired,

  // Document attributes
  authors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ).isRequired,
  description: PropTypes.string.isRequired,
  descriptionLanguage: PropTypes.string.isRequired,
  documentMainLanguage: PropTypes.string.isRequired,
  documentType: PropTypes.number.isRequired,
  publicationDate: PropTypes.instanceOf(Date),
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ).isRequired,
  title: PropTypes.string.isRequired,
  titleLanguage: PropTypes.string.isRequired,

  // On change functions
  onAuthorsChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onDescriptionLanguageChange: PropTypes.func.isRequired,
  onDocumentMainLanguageChange: PropTypes.func.isRequired,
  onDocumentTypeChange: PropTypes.func.isRequired,
  onPublicationDateChange: PropTypes.func.isRequired,
  onSubjectsChange: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onTitleLanguageChange: PropTypes.func.isRequired,

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default DocumentForm;
