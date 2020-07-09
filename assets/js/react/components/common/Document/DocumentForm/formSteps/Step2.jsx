import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DocumentFormContext } from '../Provider';

import EditorAutoComplete from '../formElements/EditorAutoComplete';
import LibraryAutoComplete from '../formElements/LibraryAutoComplete';
import MassifAutoComplete from '../formElements/MassifAutoComplete';
import MultipleSelect from '../formElements/MultipleSelect';
import PartOfAutoComplete from '../formElements/PartOfAutoComplete';

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
  allEditors,
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  const {
    docAttributes: { editor, documentType, partOf },
  } = useContext(DocumentFormContext);

  React.useEffect(() => {
    // Common validation
    let newIsValid = true;

    // Specific validations
    if (isCollection(documentType)) {
      newIsValid = newIsValid && editor;
    } else if (isCollectionElement(documentType)) {
      newIsValid = newIsValid && editor !== null && partOf !== null;
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

  const memoizedValues = [documentType, isValid];
  return useMemo(
    () => (
      <>
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
              <EditorAutoComplete
                hasError={
                  (isCollection(documentType) ||
                    isCollectionElement(documentType)) &&
                  !editor
                }
                editorSuggestions={allEditors}
                required={
                  isCollection(documentType) ||
                  isCollectionElement(documentType)
                }
              />
            </FlexItemWrapper>
          )}

          {(isCollectionElement(documentType) || isText(documentType)) && (
            <FlexItemWrapper>
              <LibraryAutoComplete
                hasError={false}
                librarySuggestions={allLibraries}
                required={false}
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
  allEditors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  allLibraries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
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

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step2;
