import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

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
  // Doc attributes
  documentType,
  editor,
  library,
  massif,
  partOf,
  regions,
  // onChange functions
  onEditorChange,
  onLibraryChange,
  onMassifChange,
  onPartOfChange,
  onRegionsChange,

  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    // Common validation
    let newIsValid = true;

    // Specific validations
    if (isCollection(documentType)) {
      newIsValid = newIsValid && editor.id !== '';
    } else if (isCollectionElement(documentType)) {
      newIsValid = newIsValid && editor.id !== '' && partOf.id !== '';
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

  return (
    <>
      {(isText(documentType) || isCollectionElement(documentType)) && (
        <PartOfAutoComplete
          hasError={isCollectionElement(documentType) && partOf.id === ''}
          onPartOfChange={onPartOfChange}
          partOfSuggestions={allPartOf}
          partOf={partOf}
          required={isCollectionElement(documentType)}
        />
      )}

      <FlexWrapper>
        <FlexItemWrapper>
          <EditorAutoComplete
            hasError={
              (isCollection(documentType) ||
                isCollectionElement(documentType)) &&
              editor.id === ''
            }
            editor={editor}
            editorSuggestions={allEditors}
            onEditorChange={onEditorChange}
            required={
              isCollection(documentType) || isCollectionElement(documentType)
            }
          />
        </FlexItemWrapper>

        {(isCollectionElement(documentType) || isText(documentType)) && (
          <FlexItemWrapper>
            <LibraryAutoComplete
              hasError={false}
              library={library}
              librarySuggestions={allLibraries}
              onLibraryChange={onLibraryChange}
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
              getOptionLabel={(option) => `${option.name}`}
              hasError={false}
              helperText="If the document is related to one or many regions, you can link it to them."
              labelName="Regions"
              onValuesChange={onRegionsChange}
              required={false}
              value={regions}
            />
          </FlexItemWrapper>
        )}
        {(isText(documentType) || isImage(documentType)) && (
          <FlexItemWrapper>
            <MassifAutoComplete
              hasError={false}
              massifSuggestions={allMassifs}
              massif={massif}
              onMassifChange={onMassifChange}
              required={false}
            />
          </FlexItemWrapper>
        )}
      </FlexWrapper>
    </>
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

  // Document attributes
  documentType: PropTypes.number.isRequired,
  editor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  library: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  massif: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  partOf: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),

  // On change functions
  onEditorChange: PropTypes.func.isRequired,
  onLibraryChange: PropTypes.func.isRequired,
  onMassifChange: PropTypes.func.isRequired,
  onPartOfChange: PropTypes.func.isRequired,
  onRegionsChange: PropTypes.func.isRequired,

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step2;
