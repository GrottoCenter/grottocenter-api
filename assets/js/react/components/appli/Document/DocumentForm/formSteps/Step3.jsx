import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import { includes } from 'ramda';
import PagesEditor from '../formElements/PagesEditor';

import DocIdentifierEditor from '../../../../../features/DocIdentifierEditor';

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
    docAttributes: { documentType },
    validatedSteps,
  } = useContext(DocumentFormContext);

  const memoizedValues = [documentType, includes(stepId, validatedSteps)];
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
                    'Can be a volume (vol.2) or a magazine issue (n°38) for example. Use what is written on the cover of the document.',
                })}
                valueName={formatMessage({ id: 'Issue' })}
                required={false}
              />
            </FlexItemWrapper>
          )}
        </FlexWrapper>

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
