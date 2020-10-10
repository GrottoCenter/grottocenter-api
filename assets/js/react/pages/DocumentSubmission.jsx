import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Fade } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import isAuth from '../helpers/AuthHelper';
import { postDocument } from '../actions/Document';
import { displayLoginDialog } from '../actions/Auth';

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
  const { formatMessage } = useIntl();

  const [isDocSubmittedWithSuccess, setDocSubmittedWithSuccess] = useState(
    false,
  );
  const [isDocSubmitted, setDocSubmitted] = useState(false);
  const [isUserAuth, setIsUserAuth] = useState(false);

  const documentState = useSelector((state) => state.document);
  const authState = useSelector((state) => state.auth);

  const onLoginClick = () => {
    dispatch(displayLoginDialog());
  };
  const submitForm = (formData) => {
    dispatch(postDocument(formData));
    setDocSubmitted(true);
  };

  useEffect(() => {
    // Handle User Auth
    setIsUserAuth(isAuth());

    // Handle Doc Submission
    if (documentState.latestHttpCode === 200 && isDocSubmitted) {
      setDocSubmittedWithSuccess(true);
    } else {
      setDocSubmittedWithSuccess(false);
    }
  }, [
    isDocSubmittedWithSuccess,
    documentState.latestHttpCode,
    isDocSubmitted,
    authState,
  ]);

  return (
    <Layout
      title={formatMessage({ id: 'Document Submission Form' })}
      footer=""
      content={
        <>
          {isDocSubmittedWithSuccess && (
            <CenteredBlock>
              <SuccessMessage
                message={`${formatMessage({
                  id:
                    'Your document has been successfully submitted, thank you!',
                })} ${formatMessage({
                  id: 'It will be verified by one of ours moderators.',
                })}`}
              />
              <SpacedButton
                onClick={() => history.push('')}
                variant="contained"
              >
                <Translate>Go to home page</Translate>
              </SpacedButton>
            </CenteredBlock>
          )}
          {isUserAuth && !isDocSubmittedWithSuccess && (
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
                      <ErrorMessage message={formatMessage({ id: error })} />
                    </Fade>
                  ))}
                </CenteredBlock>
              )}
            </>
          )}
          {!isUserAuth && (
            <CenteredBlock>
              <ErrorMessage
                message={formatMessage({
                  id:
                    'You must be authenticated to submit a document to Grottocenter.',
                })}
              />
              <SpacedButton onClick={onLoginClick} variant="contained">
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
