import React, { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Fade, Typography } from '@material-ui/core';
import ReplayIcon from '@material-ui/icons/Replay';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { isUser } from '../helpers/AuthHelper';
import { isArticle } from '../components/appli/Document/DocumentForm/DocumentTypesHelper';
import {
  postDocument,
  resetApiMessages,
  updateDocument,
} from '../actions/Document';
import { displayLoginDialog } from '../actions/Auth';

import DocumentFormProvider, {
  DocumentFormContext,
} from '../components/appli/Document/DocumentForm/Provider';
import { defaultValuesTypes } from '../components/appli/Document/DocumentForm/types';

import DocumentForm from '../components/appli/Document/DocumentForm';
import Layout from '../components/common/Layouts/Fixed/FixedContent';
import Translate from '../components/common/Translate';
import ErrorMessage from '../components/common/StatusMessage/ErrorMessage';
import SuccessMessage from '../components/common/StatusMessage/SuccessMessage';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(1)}px;
`}
`;

const CenteredBlock = styled.div`
  text-align: center;
`;

const DocumentSubmission = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const {
    docAttributes: {
      documentMainLanguage,
      documentType,
      editor,
      isNewDocument,
      library,
      partOf,
      publicationDate,
      titleAndDescriptionLanguage,
    },
    resetContext,
    updateAttribute,
  } = useContext(DocumentFormContext);

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

  const submitUpdateForm = (formData) => {
    dispatch(updateDocument(formData));
    setDocSubmitted(true);
  };

  const onSubmitAnotherDocument = () => {
    dispatch(resetApiMessages());
    resetContext();
  };

  const onSubmitAnotherArticle = () => {
    dispatch(resetApiMessages());
    resetContext();
    // Keep some values to resubmit an article
    updateAttribute('documentMainLanguage', documentMainLanguage);
    updateAttribute('documentType', documentType);
    updateAttribute('editor', editor);
    updateAttribute('library', library);
    updateAttribute('partOf', partOf);
    updateAttribute('publicationDate', publicationDate);
    updateAttribute('titleAndDescriptionLanguage', titleAndDescriptionLanguage);
  };

  useEffect(() => {
    // Handle User Auth
    setIsUserAuth(isUser());

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
                message={
                  isNewDocument
                    ? `${formatMessage({
                        id:
                          'Your document has been successfully submitted, thank you!',
                      })} ${formatMessage({
                        id: 'It will be verified by one of ours moderators.',
                      })}`
                    : `${formatMessage({
                        id: 'Document successfully updated.',
                      })}`
                }
              />
              {isArticle(documentType) && (
                <>
                  <SpacedButton
                    color="primary"
                    onClick={onSubmitAnotherArticle}
                    startIcon={<ReplayIcon />}
                    variant="contained"
                  >
                    <Translate>Submit another article</Translate>
                  </SpacedButton>
                  <Typography variant="body1">
                    {formatMessage({
                      id:
                        'By clicking this button, you will be able to submit another article without re-typing some values (publication date, parent document etc.).',
                    })}
                  </Typography>
                  <br />
                </>
              )}
              {isNewDocument && (
                <>
                  <SpacedButton
                    onClick={onSubmitAnotherDocument}
                    variant="contained"
                  >
                    <Translate>Submit another document</Translate>
                  </SpacedButton>
                  <SpacedButton
                    onClick={() => history.push('')}
                    variant="contained"
                  >
                    <Translate>Go to home page</Translate>
                  </SpacedButton>
                </>
              )}
            </CenteredBlock>
          )}
          {isUserAuth && !isDocSubmittedWithSuccess && (
            <>
              <DocumentForm
                isLoading={documentState.isLoading}
                onSubmit={submitForm}
                onUpdate={submitUpdateForm}
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
                    'You must be authenticated and an user to submit a document to Grottocenter.',
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

const HydratedDocumentSubmission = ({ defaultValues, ...props }) => (
  <DocumentFormProvider defaultValues={defaultValues}>
    <DocumentSubmission {...props} />
  </DocumentFormProvider>
);

HydratedDocumentSubmission.propTypes = {
  defaultValues: defaultValuesTypes,
};

export default HydratedDocumentSubmission;
