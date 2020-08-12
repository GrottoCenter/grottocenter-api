import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { includes } from 'ramda';
import PagesEditor from '../formElements/PagesEditor';
import StringInput from '../../../../common/Form/StringInput';

import DocIdentifierEditor from '../../../../../features/DocIdentifierEditor';

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

const Step3 = ({ stepId }) => {
  const {
    docAttributes: { documentType, identifier, identifierType, issue },
    updateAttribute,
    validatedSteps,
  } = useContext(DocumentFormContext);

  const memoizedValues = [documentType, includes(stepId, validatedSteps)];
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

        <DocIdentifierEditor
          documentType={documentType}
          identifier={identifier}
          identifierType={identifierType}
          setIdentifier={(value) => updateAttribute('identifier', value)}
          setIdentifierType={(value) =>
            updateAttribute('identifierType', value)
          }
        />
      </>
    ),
    [memoizedValues],
  );
};

Step3.propTypes = {
  stepId: PropTypes.number.isRequired,
};

export default Step3;
