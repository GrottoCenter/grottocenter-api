import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { includes, pathOr } from 'ramda';

import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';
import MassifAutoComplete from '../formElements/MassifAutoComplete';
import MultipleSelect from '../formElements/MultipleSelect';
import PartOfAutoComplete from '../formElements/PartOfAutoComplete';

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

const Step2 = ({
  allAuthors,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
  stepId,
}) => {
  const {
    docAttributes: { editor, documentType, library, partOf },
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
        <MultipleSelect
          allPossibleValues={allAuthors}
          contextValueNameToUpdate="authors"
          getOptionLabel={(option) => `${option.name} ${option.surname}`}
          computeHasError={(newAuthors) =>
            (isImage(documentType) || isText(documentType)) &&
            newAuthors.length === 0
          }
          helperText="Use authors' full name, no abreviation. In a next version of the website, if the author is not in the Grottocenter database, you will be able to add it."
          labelName="Authors"
          required={isImage(documentType) || isText(documentType)}
        />

        <MultipleSelect
          allPossibleValues={allSubjects}
          contextValueNameToUpdate="subjects"
          getOptionLabel={(option) => `${option.id} ${option.subject}`}
          computeHasError={(newSubjects) =>
            isText(documentType) && newSubjects.length === 0
          }
          helperText="Be precise about the subjects discussed in the document: there are plenty of subject choices in Grottocenter."
          labelName="Subjects"
          required={isText(documentType)}
        />
        {(isText(documentType) || isCollectionElement(documentType)) && (
          <PartOfAutoComplete
            hasError={isCollectionElement(documentType) && !partOf}
            partOfSuggestions={allPartOf}
            required={isCollectionElement(documentType)}
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
              <MultipleSelect
                allPossibleValues={allRegions}
                contextValueNameToUpdate="regions"
                getOptionLabel={(option) => `${option.name}`}
                computeHasError={() => false}
                helperText="If the document is related to one or many regions, you can link it to them."
                labelName="Regions"
                required={false}
              />
            </FlexItemWrapper>
          )}
          {(isText(documentType) || isImage(documentType)) && (
            <FlexItemWrapper>
              <MassifAutoComplete
                hasError={false}
                massifSuggestions={allMassifs}
                required={false}
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
  allAuthors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ).isRequired,
  allMassifs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  allPartOf: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      issue: PropTypes.string,
      documenType: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
      partOf: PropTypes.shape({}),
    }),
  ),
  allRegions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  allSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ).isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step2;
