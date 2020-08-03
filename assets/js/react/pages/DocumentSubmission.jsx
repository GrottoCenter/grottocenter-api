import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Fade, FormControl, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import isAuth from '../helpers/AuthHelper';
import { postDocument } from '../actions/Document';
import DocumentForm from '../components/appli/Document/DocumentForm';
import DocumentFormProvider, {
  defaultContext,
  DocumentFormContext,
} from '../components/appli/Document/DocumentForm/Provider';
import Layout from '../components/common/Layouts/Fixed/FixedContent';
import Translate from '../components/common/Translate';

// TODO: to be removed
import {
  allAuthors,
  allEditors,
  allIdentifierTypes,
  allLanguages,
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
} from '../components/appli/Document/DocumentForm/stories/documentFormFakeData';

// ====================
// TODO : get this component from LoginForm. Refactor it later.
const ErrorText = styled(Typography)`
  ${({ theme }) => `
  background-color: ${theme.palette.errorColor};
  border-radius: ${theme.shape.borderRadius};
  color: ${theme.palette.common.white};
  margin: ${theme.spacing(0)}px 0;
  padding: ${theme.spacing(2)}px;
  `}
`;

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(1)}px;
`}
`;

// ====================

const DocumentSubmission = () => {
  const { docAttributes } = useContext(DocumentFormContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const documentState = useSelector((state) => state.document);

  const { formatMessage } = useIntl();

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(postDocument(docAttributes));
  };

  return (
    <Layout
      title={formatMessage({ id: 'Document Submission Form' })}
      footer=""
      content={
        isAuth() ? (
          <>
            <DocumentForm
              allAuthors={allAuthors}
              allEditors={allEditors}
              allIdentifierTypes={allIdentifierTypes}
              allLanguages={allLanguages}
              allLibraries={allLibraries}
              allMassifs={allMassifs}
              allPartOf={allPartOf}
              allRegions={allRegions}
              allSubjects={allSubjects}
              isLoading={documentState.isLoading}
              onSubmit={onSubmit}
            />
            {documentState.errorMessages.length > 0 && (
              <FormControl>
                {documentState.errorMessages.map((error) => (
                  <Fade in={documentState.errorMessages.length > 0} key={error}>
                    <ErrorText>
                      <Translate>{error}</Translate>
                    </ErrorText>
                  </Fade>
                ))}
              </FormControl>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <ErrorText>
              <Translate>
                You must be authenticated to submit a document to Grottocenter.
              </Translate>
            </ErrorText>
            <SpacedButton
              onClick={() => history.push('/ui/login')}
              variant="contained"
            >
              <Translate>Log in</Translate>
            </SpacedButton>
            <SpacedButton onClick={() => history.push('')} variant="contained">
              <Translate>Go to home page</Translate>
            </SpacedButton>
          </div>
        )
      }
    />
  );
};

const DocumentSubmissionWithContext = () => {
  return (
    <DocumentFormProvider docAttributes={defaultContext.docAttributes}>
      <DocumentSubmission />
    </DocumentFormProvider>
  );
};

DocumentSubmission.propTypes = {};
DocumentSubmissionWithContext.propTypes = {};

export default DocumentSubmissionWithContext;
