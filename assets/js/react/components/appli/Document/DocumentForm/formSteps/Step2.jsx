import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { pathOr } from 'ramda';

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
  allMassifs,
  allPartOf,
  allRegions,
  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  const {
    docAttributes: { editor, documentType, library, partOf },
    updateAttribute,
  } = useContext(DocumentFormContext);

  React.useEffect(() => {
    // Common validation
    let newIsValid = true;

    // Specific validations
    if (isCollection(documentType)) {
      newIsValid = newIsValid && editor !== null;
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

  const memoizedValues = [documentType, isValid, partOf];
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
