import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Fade } from '@material-ui/core';

import { DocumentFormContext } from '../Provider';

import DescriptionEditor from '../formElements/DescriptionEditor';
import DocumentTypeSelect from '../formElements/DocumentTypeSelect';
import LanguageSelect from '../formElements/LanguageSelect';
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

const DocumentForm = ({ allLanguages, onStepIsValidChange, stepId }) => {
  const [isValid, setIsValid] = React.useState(false);

  const {
    docAttributes: {
      description,
      descriptionLanguage,
      documentType,
      publicationDate,
      title,
      titleLanguage,
    },
  } = useContext(DocumentFormContext);

  React.useEffect(() => {
    // Common validation (title and description)
    let newIsValid =
      title !== '' &&
      titleLanguage !== null &&
      description !== '' &&
      descriptionLanguage !== null;

    // Specific validations
    if (documentType === null) {
      newIsValid = false;
    } else if (isCollection(documentType)) {
      // nothing to do
    } else if (isCollectionElement(documentType)) {
      newIsValid = newIsValid && publicationDate !== null;
    } else if (isText(documentType)) {
      newIsValid = true;
    } else if (isImage(documentType)) {
      newIsValid = true;
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
                  </TitleEditorWrapper>
                  {!isCollection(documentType) && (
                    <PublicationDateWrapper>
                      <PublicationDatePicker
                        required={isCollectionElement(documentType)}
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
              </>
            )}
          </div>
        </Fade>
      </>
    ),
    memoizedValues,
  );
};

DocumentForm.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default DocumentForm;
