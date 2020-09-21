import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Fade } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import isAuth from '../helpers/AuthHelper';
import { postDocument } from '../actions/Document';

import DocumentForm from '../components/appli/Document/DocumentForm';
import Layout from '../components/common/Layouts/Fixed/FixedContent';
import Translate from '../components/common/Translate';
import ErrorMessage from '../components/common/StatusMessage/ErrorMessage';
import SuccessMessage from '../components/common/StatusMessage/SuccessMessage';

// ====================

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(1)}px;
`}
`;

const CenteredBlock = styled.div`
  text-align: center;
`;

// ====================

const DocumentSubmission = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [isDocSubmittedWithSuccess, setDocSubmittedWithSuccess] = useState(
    false,
  );
  const [isDocSubmitted, setDocSubmitted] = useState(false);

  const documentState = useSelector((state) => state.document);

  const { formatMessage } = useIntl();
  const submitForm = (formData) => {
    dispatch(postDocument(formData));
    setDocSubmitted(true);
  };

  useEffect(() => {
    if (documentState.latestHttpCode === 200 && isDocSubmitted) {
      setDocSubmittedWithSuccess(true);
    } else {
      setDocSubmittedWithSuccess(false);
    }
  }, [isDocSubmittedWithSuccess, documentState.latestHttpCode, isDocSubmitted]);

  return (
    <Layout
      title={formatMessage({ id: 'Document Submission Form' })}
      footer=""
      content={
        <>
          {isDocSubmittedWithSuccess && (
            <CenteredBlock>
              <SuccessMessage>
                <Translate>
                  Your document has been successfully submitted, thank you!
                </Translate>
                <br />
                <Translate>
                  It will be verified by one of ours moderators.
                </Translate>
              </SuccessMessage>
              <SpacedButton
                onClick={() => history.push('')}
                variant="contained"
              >
                <Translate>Go to home page</Translate>
              </SpacedButton>
            </CenteredBlock>
          )}
          {isAuth() && !isDocSubmittedWithSuccess && (
            <>
              <DocumentForm
                isLoading={documentState.isLoading}
                onSubmit={submitForm}
              />
              {documentState.errorMessages.length > 0 && (
                <CenteredBlock>
                  {documentState.errorMessages.map((error) => (
                    <Fade
                      in={documentState.errorMessages.length > 0}
                      key={error}
                    >
                      <ErrorMessage>
                        <Translate>{error}</Translate>
                      </ErrorMessage>
                    </Fade>
                  ))}
                </CenteredBlock>
              )}
            </>
          )}
          {!isAuth() && (
            <CenteredBlock>
              <ErrorMessage>
                <Translate>
                  You must be authenticated to submit a document to
                  Grottocenter.
                </Translate>
              </ErrorMessage>
              <SpacedButton
                onClick={() => history.push('/ui/login')}
                variant="contained"
              >
                <Translate>Log in</Translate>
              </SpacedButton>
              <SpacedButton
                onClick={() => history.push('')}
                variant="contained"
              >
                <Translate>Go to home page</Translate>
              </SpacedButton>
            </CenteredBlock>
          )}
        </>
      }
    />
  );
};

DocumentSubmission.propTypes = {};

export default DocumentSubmission;
