import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { includes, pathOr } from 'ramda';

import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

import DocumentAutoComplete from '../../../../../features/DocumentAutoComplete';
import MassifAutoComplete from '../../../../../features/MassifAutoComplete';
import MultipleBBSRegionsSelect from '../../../../../features/MultipleBBSRegionsSelect';
import MultipleCaversSelect from '../../../../../features/MultipleCaversSelect';
import MultipleSubjectsSelect from '../../../../../features/MultipleSubjectsSelect';
import OrganizationAutoComplete from '../../../../../features/OrganizationAutoComplete';

import {
  isImage,
  isCollectionElement,
  isText,
  isCollection,
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
    docAttributes: {
      authors,
      editor,
      documentType,
      library,
      massif,
      partOf,
      regions,
      subjects,
    },
    updateAttribute,
    validatedSteps,
  } = useContext(DocumentFormContext);

  const memoizedValues = [
    documentType,
    includes(stepId, validatedSteps),
    partOf,
  ];
  return useMemo(
    () => (
      <>
        <MultipleCaversSelect
          computeHasError={(newAuthors) =>
            (isImage(documentType) || isText(documentType)) &&
            newAuthors.length === 0
          }
          helperText="Use this search bar to find existing authors. In a next version of the website, if the author is not in the Grottocenter database, you will be able to add it."
          labelName="Authors"
          required={isImage(documentType) || isText(documentType)}
          setValue={(newValue) => updateAttribute('authors', newValue)}
          value={authors}
        />

        <MultipleSubjectsSelect
          computeHasError={(newSubjects) =>
            isText(documentType) && newSubjects.length === 0
          }
          helperText="Use this search bar to find subjects. Be precise about the subjects discussed in the document: there are plenty of subject choices in Grottocenter."
          labelName="Subjects"
          required={isText(documentType)}
          setValue={(newValue) => updateAttribute('subjects', newValue)}
          value={subjects}
        />

        {(isText(documentType) || isCollectionElement(documentType)) && (
          <DocumentAutoComplete
            isValueForced={false}
            helperContent={
              <Translate>
                Use the search bar to search for an existing document.
              </Translate>
            }
            labelText="Document Parent"
            required={false}
            searchLabelText="Search for a document..."
            setValue={(newValue) => updateAttribute('partOf', newValue)}
            value={partOf}
          />
        )}

        <FlexWrapper>
          {(isCollection(documentType) ||
            isCollectionElement(documentType) ||
            isText(documentType)) && (
            <FlexItemWrapper>
              <OrganizationAutoComplete
                isValueForced={pathOr(null, ['editor'], partOf) !== null}
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
                required={
                  isCollection(documentType) ||
                  isCollectionElement(documentType)
                }
                searchLabelText="Search for an editor..."
                setValue={(newValue) => updateAttribute('editor', newValue)}
                value={editor}
              />
            </FlexItemWrapper>
          )}

          {(isCollectionElement(documentType) || isText(documentType)) && (
            <FlexItemWrapper>
              <OrganizationAutoComplete
                isValueForced={pathOr(null, ['library'], partOf) !== null}
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
                setValue={(newValue) => updateAttribute('library', newValue)}
                value={library}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>

        <FlexWrapper>
          {(isText(documentType) || isImage(documentType)) && (
            <FlexItemWrapper>
              <MultipleBBSRegionsSelect
                computeHasError={() => false}
                helperText="If the document is related to one or many regions, you can link it to them."
                labelName="Regions"
                required={false}
                setValue={(newValue) => updateAttribute('regions', newValue)}
                value={regions}
              />
            </FlexItemWrapper>
          )}
          {(isText(documentType) || isImage(documentType)) && (
            <FlexItemWrapper>
              <MassifAutoComplete
                isValueForced={pathOr(null, ['massif'], partOf) !== null}
                helperContent={
                  <Translate>
                    If the document is related to a massif, you can link it to
                    it. Use the search bar above to find an existing massif.
                  </Translate>
                }
                labelText="Massif"
                required={false}
                searchLabelText="Search for a massif..."
                setValue={(newValue) => updateAttribute('massif', newValue)}
                value={massif}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>
      </>
    ),
    [memoizedValues],
  );
};

Step2.propTypes = {
  stepId: PropTypes.number.isRequired,
};

export default Step2;
