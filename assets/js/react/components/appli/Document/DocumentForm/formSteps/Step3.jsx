import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { includes } from 'ramda';
import IdentifierEditor from '../formElements/IdentifierEditor';
import PagesEditor from '../formElements/PagesEditor';
import StringInput from '../../../../common/Form/StringInput';

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

const Step3 = ({ allIdentifierTypes, stepId }) => {
  const {
    docAttributes: { documentType, issue },
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
  stepId: PropTypes.number.isRequired,
};

export default Step3;
