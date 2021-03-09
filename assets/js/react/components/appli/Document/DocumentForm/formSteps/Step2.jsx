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
          helperText="Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the “+” button on the right."
          labelName="Authors"
          required={isOther(documentType) || isArticle(documentType)}
        />

        <MultipleSubjectsSelect
          computeHasError={(newSubjects) =>
            isArticle(documentType) && newSubjects.length === 0
          }
          contextValueName="subjects"
          helperText="Choose one or more subjects from those defined by the BBS. The list of subjects and their description is available here => https://www.ssslib.ch/bbs/wp-content/uploads/2017/03/chapter_and_geo_1_2008.pdf."
          labelName="BBS subjects"
          required={isArticle(documentType)}
        />

        {(isArticle(documentType) || isIssue(documentType)) && (
          <DocumentAutoComplete
            contextValueName="partOf"
            helperContent={
              <Translate>
                The parent document is the document that contains the document
                you are submitting (an article has a periodical issue as its
                parent document, a periodical issue has a periodical as its
                parent document).
              </Translate>
            }
            labelText="Parent document"
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
                    The editor is the organization that ensures the publication
                    of the document. Choose one or more organizations from those
                    already registered. If the organization you are looking for
                    does not exist in Grottocenter, you can add it by using the
                    “+” button on the right.
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
                  <Translate>
                    The library is the place where the document can be
                    consulted. Choose an organization from those already
                    registered at Grottocenter. If the organization you are
                    looking for does not exist in Grottocenter, you can add it
                    by using the “+” button on the right.
                  </Translate>
                }
                helperContentIfValueIsForced={
                  <>
                    <Translate>
                      The library has been deduced from the parent document.
                    </Translate>
                    <br />
                    <Translate>
                      The library is the place where the document can be
                      consulted. Choose an organization from those already
                      registered at Grottocenter. If the organization you are
                      looking for does not exist in Grottocenter, you can add it
                      by using the “+” button on the right.
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
                helperText="If the document relates to one or more regions, choose from those defined by the BBS."
                labelName="BBS regions"
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
                    If the document relates to a massif, choose from those
                    already registered in Grottocenter.
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
