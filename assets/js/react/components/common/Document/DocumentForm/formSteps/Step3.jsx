import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import IdentifierEditor from '../formElements/IdentifierEditor';
import PagesEditor from '../formElements/PagesEditor';
import StringInput from '../formElements/StringInput';

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

const Step3 = ({
  allIdentifierTypes,
  // Doc attributes
  documentType,
  endPage,
  identifier,
  identifierType,
  issue,
  pageComment,
  startPage,

  // onChange functions
  onEndPageChange,
  onIdentifierChange,
  onIdentifierTypeChange,
  onIssueChange,
  onPageCommentChange,
  onStartPageChange,

  onStepIsValidChange,
  stepId,
}) => {
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
  return (
    <>
      <FlexWrapper>
        {isText(documentType) && (
          <FlexItemWrapper>
            <PagesEditor
              endPage={endPage}
              pageComment={pageComment}
              startPage={startPage}
              onEndPageChange={onEndPageChange}
              onPageCommentChange={onPageCommentChange}
              onStartPageChange={onStartPageChange}
            />
          </FlexItemWrapper>
        )}
        {isCollectionElement(documentType) && (
          <FlexItemWrapper>
            <StringInput
              helperText="Can be a volume (vol.2) or a magazine issue (n°38) for example. Use what is written on the cover of the document."
              onValueChange={onIssueChange}
              value={issue}
              valueName="Issue"
            />
          </FlexItemWrapper>
        )}
      </FlexWrapper>

      <IdentifierEditor
        allIdentifierTypes={allIdentifierTypes}
        documentType={documentType}
        identifier={identifier}
        identifierType={identifierType}
        onIdentifierChange={onIdentifierChange}
        onIdentifierTypeChange={onIdentifierTypeChange}
      />

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

  // Document attributes
  documentType: PropTypes.number.isRequired,
  endPage: PropTypes.number.isRequired,
  identifier: PropTypes.string,
  identifierType: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }),
  issue: PropTypes.string.isRequired,
  pageComment: PropTypes.string.isRequired,
  startPage: PropTypes.number.isRequired,

  // On change functions
  onEndPageChange: PropTypes.func.isRequired,
  onIdentifierChange: PropTypes.func.isRequired,
  onIdentifierTypeChange: PropTypes.func.isRequired,
  onIssueChange: PropTypes.func.isRequired,
  onPageCommentChange: PropTypes.func.isRequired,
  onStartPageChange: PropTypes.func.isRequired,

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step3;
