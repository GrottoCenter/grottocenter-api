import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Fade } from '@material-ui/core';
import { includes } from 'ramda';

import { DocumentFormContext } from '../Provider';
import DescriptionEditor from '../formElements/DescriptionEditor';
import DocumentTypeSelect from '../formElements/DocumentTypeSelect';
import PublicationDatePicker from '../formElements/PublicationDatePicker';
import TitleEditor from '../formElements/TitleEditor';

import DocumentLanguageSelect from '../../../../../features/DocumentLanguageSelect';

import {
  allDocumentTypes,
  isCollection,
  isIssue,
  isOther,
  isUnknown,
} from '../DocumentTypesHelper';

// ===================================
const FlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const FlexItemWrapper = styled.div`
  flex: 1;
`;

const BigFlexItemWrapper = styled.div`
  flex: 2;
`;

const TitleAndLanguageWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-basis: 600px;
  flex-wrap: wrap;
`;

const PublicationDateWrapper = styled.div`
  flex: 1;
  flex-basis: 350px;
`;

const Step1 = ({ stepId }) => {
  const {
    docAttributes: { documentType },
    validatedSteps,
  } = useContext(DocumentFormContext);

  /**
   * Performance improvement to avoid useless re-rendering
   * Step1 needs to re-render only if :
   * - it becomes valid
   * - the DocumentType changes
   */
  const memoizedValues = [documentType, includes(stepId, validatedSteps)];
  return useMemo(
    () => (
      <>
        <FlexWrapper>
          <FlexItemWrapper>
            <DocumentTypeSelect
              allDocumentTypes={allDocumentTypes}
              helperText="For example, a magazine issue is an Issue, an article from a magazine is an Article."
              required
            />
          </FlexItemWrapper>
          <Fade in={!isUnknown(documentType)}>
            <FlexItemWrapper>
              <DocumentLanguageSelect
                helperText="Language in which the document is written."
                labelText="Document main language"
                contextValueName="documentMainLanguage"
                required={!isOther(documentType)}
              />
            </FlexItemWrapper>
          </Fade>
        </FlexWrapper>

        <Fade in={!isUnknown(documentType)}>
          <div>
            {!isUnknown(isUnknown) && (
              <>
                <TitleAndLanguageWrapper>
                  <BigFlexItemWrapper>
                    <TitleEditor required />
                  </BigFlexItemWrapper>
                  <FlexItemWrapper style={{ minWidth: '300px' }}>
                    <DocumentLanguageSelect
                      helperText="Language used for the title and the description you provide."
                      labelText="Title and description language"
                      contextValueName="titleAndDescriptionLanguage"
                      required
                    />
                  </FlexItemWrapper>
                </TitleAndLanguageWrapper>

                <FlexWrapper>
                  <FlexItemWrapper>
                    <DescriptionEditor required />
                    {!isCollection(documentType) && (
                      <PublicationDateWrapper>
                        <PublicationDatePicker
                          required={isIssue(documentType)}
                        />
                      </PublicationDateWrapper>
                    )}
                  </FlexItemWrapper>
                </FlexWrapper>
              </>
            )}
          </div>
        </Fade>
      </>
    ),
    memoizedValues,
  );
};

Step1.propTypes = {
  stepId: PropTypes.number.isRequired,
};

export default Step1;
