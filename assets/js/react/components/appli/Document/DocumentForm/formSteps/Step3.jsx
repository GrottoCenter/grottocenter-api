import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import { includes } from 'ramda';
import PagesEditor from '../formElements/PagesEditor';

import DocIdentifierEditor from '../../../../../features/DocIdentifierEditor';

import StringInput from '../../../../common/Form/StringInput';
import IssueEditor from '../formElements/IssueEditor';
import { DocumentFormContext } from '../Provider';
import { isArticle, isIssue } from '../DocumentTypesHelper';

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
  const { formatMessage } = useIntl();

  const {
    docAttributes: { authorComment, documentType },
    validatedSteps,
    updateAttribute,
  } = useContext(DocumentFormContext);

  const memoizedValues = [
    authorComment,
    documentType,
    includes(stepId, validatedSteps),
  ];
  return useMemo(
    () => (
      <>
        <FlexWrapper>
          {isArticle(documentType) && (
            <FlexItemWrapper>
              <PagesEditor />
            </FlexItemWrapper>
          )}
          {isIssue(documentType) && (
            <FlexItemWrapper>
              <IssueEditor
                helperText={formatMessage({
                  id:
                    'Use the same wording that is used on the document: Vol.12, Number 15, No.158...',
                })}
                valueName={formatMessage({ id: 'Periodical issue' })}
                required={false}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>

        <StringInput
          hasError={false}
          helperText={formatMessage({
            id: 'Additional information about the document.',
          })}
          onValueChange={(newValue) =>
            updateAttribute('authorComment', newValue)
          }
          value={authorComment}
          valueName={formatMessage({ id: 'Comment' })}
        />

        <DocIdentifierEditor
          documentType={documentType}
          contextIdentifierValueName="identifier"
          contextIdentifierTypeValueName="identifierType"
        />
      </>
    ),
    memoizedValues,
  );
};

Step3.propTypes = {
  stepId: PropTypes.number.isRequired,
};

export default Step3;
