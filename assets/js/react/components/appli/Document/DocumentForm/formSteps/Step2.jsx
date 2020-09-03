import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { includes } from 'ramda';

import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

import DocumentAutoComplete from '../../../../../features/DocumentAutoComplete';
import MassifAutoComplete from '../../../../../features/MassifAutoComplete';
import MultipleBBSRegionsSelect from '../../../../../features/MultipleBBSRegionsSelect';
import MultipleCaversSelect from '../../../../../features/MultipleCaversSelect';
import MultipleSubjectsSelect from '../../../../../features/MultipleSubjectsSelect';
import OrganizationAutoComplete from '../../../../../features/OrganizationAutoComplete';

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
  const {
    docAttributes: { documentType },
    validatedSteps,
  } = useContext(DocumentFormContext);

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
          helperText="Use this search bar to find existing authors. In a next version of the website, if the author is not in the Grottocenter database, you will be able to add it."
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
            labelText="Document Parent"
            required={isIssue(documentType)}
            searchLabelText="Search for a document..."
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
                    Use the search bar above to find an existing editor.
                  </Translate>
                }
                helperContentIfValueIsForced={
                  <Translate>
                    The editor has been deduced from the parent document.
                  </Translate>
                }
                labelText="Editor"
                required={isCollection(documentType) || isIssue(documentType)}
                searchLabelText="Search for an editor..."
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
                      Use the search bar above to find an existing library.
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
                searchLabelText="Search for a library..."
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
                searchLabelText="Search for a massif..."
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
