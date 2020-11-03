import React, { useContext, useMemo } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { includes } from 'ramda';

import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

import DocumentAutoComplete from '../../../../../features/Form/DocumentAutoComplete';
import MassifAutoComplete from '../../../../../features/Form/MassifAutoComplete';
import MultipleBBSRegionsSelect from '../../../../../features/Form/MultipleBBSRegionsSelect';
import MultipleCaversSelect from '../../../../../features/Form/MultipleCaversSelect';
import MultipleSubjectsSelect from '../../../../../features/Form/MultipleSubjectsSelect';
import OrganizationAutoComplete from '../../../../../features/Form/OrganizationAutoComplete';

import {
  isIssue,
  isArticle,
  isCollection,
  isOther,
} from '../DocumentTypesHelper';

// ===================================
const FlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const FlexItemWrapper = styled.div`
  flex: 1;
  flex-basis: 300px;
`;
// ===================================

const Step2 = ({ stepId }) => {
  const { formatMessage } = useIntl();
  const {
    docAttributes: { documentType },
    validatedSteps,
  } = useContext(DocumentFormContext);

  /*
    The user must not search all the documents everytime:
      - if he creates an article, he's searching for an issue
      - if he creates an issue, he's searching for a collection
      - else he's searching for any document.
  */
  const docSearchedTypes = [
    // eslint-disable-next-line no-nested-ternary
    isArticle(documentType)
      ? 'document-issues'
      : isIssue(documentType)
      ? 'document-collections'
      : 'documents',
  ];

  const memoizedValues = [documentType, includes(stepId, validatedSteps)];

  return useMemo(
    () => (
      <>
        <MultipleCaversSelect
          computeHasError={(newAuthors) =>
            (isOther(documentType) || isArticle(documentType)) &&
            newAuthors.length === 0
          }
          contextValueName="authors"
          helperText="Use this search bar to find existing authors. If not found, you can create a new author by using the right menu."
          labelName="Authors"
          required={isOther(documentType) || isArticle(documentType)}
        />

        <MultipleSubjectsSelect
          computeHasError={(newSubjects) =>
            isArticle(documentType) && newSubjects.length === 0
          }
          contextValueName="subjects"
          helperText="Use this search bar to find subjects. Be precise about the subjects discussed in the document: there are plenty of subject choices in Grottocenter."
          labelName="Subjects"
          required={isArticle(documentType)}
        />

        {(isArticle(documentType) || isIssue(documentType)) && (
          <DocumentAutoComplete
            contextValueName="partOf"
            helperContent={
              <Translate>
                Use the search bar to search for an existing document.
              </Translate>
            }
            labelText="Parent Document"
            required={isIssue(documentType)}
            resourceTypes={docSearchedTypes}
            searchLabelText={formatMessage({ id: 'Search for a document...' })}
          />
        )}

        <FlexWrapper>
          {(isCollection(documentType) ||
            isIssue(documentType) ||
            isArticle(documentType)) && (
            <FlexItemWrapper>
              <OrganizationAutoComplete
                contextValueName="editor"
                helperContent={
                  <Translate>
                    Use the search bar above to find an existing editor. If not
                    found, you can create a new author by using the right menu.
                  </Translate>
                }
                helperContentIfValueIsForced={
                  <Translate>
                    The editor has been deduced from the parent document.
                  </Translate>
                }
                labelText="Editor"
                required={isCollection(documentType) || isIssue(documentType)}
                searchLabelText={formatMessage({
                  id: 'Search for an editor...',
                })}
              />
            </FlexItemWrapper>
          )}

          {(isIssue(documentType) || isArticle(documentType)) && (
            <FlexItemWrapper>
              <OrganizationAutoComplete
                contextValueName="library"
                helperContent={
                  <>
                    <Translate>
                      Use the search bar above to find an existing library. If
                      not found, you can create a new author by using the right
                      menu.
                    </Translate>
                    <br />
                    <Translate>
                      The library is where the document is physically stored.
                    </Translate>
                  </>
                }
                helperContentIfValueIsForced={
                  <>
                    <Translate>
                      The library has been deduced from the parent document.
                    </Translate>
                    <br />
                    <Translate>
                      The library is where the document is physically stored.
                    </Translate>
                  </>
                }
                labelText="Library"
                required={false}
                searchLabelText={formatMessage({
                  id: 'Search for a library...',
                })}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>

        <FlexWrapper>
          {(isArticle(documentType) || isOther(documentType)) && (
            <FlexItemWrapper>
              <MultipleBBSRegionsSelect
                computeHasError={() => false}
                contextValueName="regions"
                helperText="If the document is related to one or many regions, you can link it to them."
                labelName="Regions"
                required={false}
              />
            </FlexItemWrapper>
          )}
          {(isArticle(documentType) || isOther(documentType)) && (
            <FlexItemWrapper>
              <MassifAutoComplete
                contextValueName="massif"
                helperContent={
                  <Translate>
                    If the document is related to a massif, you can link it to
                    it. Use the search bar above to find an existing massif.
                  </Translate>
                }
                labelText="Massif"
                required={false}
                searchLabelText={formatMessage({
                  id: 'Search for a massif...',
                })}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>
      </>
    ),
    memoizedValues,
  );
};

Step2.propTypes = {
  stepId: PropTypes.number.isRequired,
};

export default Step2;
