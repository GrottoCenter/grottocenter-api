import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import IdentifierEditor from '../formElements/IdentifierEditor';
import PagesEditor from '../formElements/PagesEditor';
import StringInput from '../formElements/StringInput';

import { DocumentFormContext } from '../Provider';
import { isText, isCollectionElement } from '../DocumentTypesHelper';

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

const Step3 = ({ allIdentifierTypes, onStepIsValidChange, stepId }) => {
  const [isValid, setIsValid] = React.useState(false);

  const {
    docAttributes: { documentType, identifier, identifierType, issue },
    updateAttribute,
  } = useContext(DocumentFormContext);

  React.useEffect(() => {
    // Common validation
    const newIsValid =
      identifier === '' || (identifier !== '' && identifierType !== null);
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
      onStepIsValidChange(stepId, newIsValid);
    }
  });

  const memoizedValues = [documentType, isValid];
  return useMemo(
    () => (
      <>
        <FlexWrapper>
          {isText(documentType) && (
            <FlexItemWrapper>
              <PagesEditor />
            </FlexItemWrapper>
          )}
          {isCollectionElement(documentType) && (
            <FlexItemWrapper>
              <StringInput
                hasError={false}
                helperText="Can be a volume (vol.2) or a magazine issue (n°38) for example. Use what is written on the cover of the document."
                valueName="Issue"
                onValueChange={(value) => updateAttribute('issue', value)}
                required={false}
                value={issue}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>

        <IdentifierEditor allIdentifierTypes={allIdentifierTypes} />
      </>
    ),
    [memoizedValues],
  );
};

Step3.propTypes = {
  allIdentifierTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ),

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step3;
