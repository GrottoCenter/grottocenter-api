import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, isNil, head, pathOr, propOr, reject, pipe } from 'ramda';
import { useHistory, useParams } from 'react-router-dom';
import DocumentSubmission from '../DocumentSubmission';
import { fetchDocumentDetails } from '../../actions/DocumentDetails';
import docInfoGetters from './docInfoGetters';
import { resetApiMessages } from '../../actions/Document';

const DocumentEdit = ({
  onSuccessfulUpdate,
  id,
  resetIsValidated,
  requireUpdate = false,
}) => {
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = documentIdFromRoute || id;
  const history = useHistory();
  const dispatch = useDispatch();
  const { isLoading, details, error } = useSelector(
    (state) => state.documentDetails,
  );

  const { latestHttpCode, errorMessages } = useSelector(
    (state) => state.document,
  );

  if (!onSuccessfulUpdate) {
    onSuccessfulUpdate = () => {
      dispatch(resetApiMessages());
      history.push(`/ui/documents/${documentId}`);
    };
  }

  useEffect(() => {
    if (!isNil(documentId)) {
      dispatch(fetchDocumentDetails(documentId, requireUpdate));
    }
  }, [documentId]);

  useEffect(() => {
    if (latestHttpCode === 200 && isEmpty(errorMessages)) {
      onSuccessfulUpdate();
    }
  }, [latestHttpCode, errorMessages]);

  const defaultValues = {
    ...reject(isNil, {
      authorComment: propOr(null, 'authorComment', details),
      authors: pathOr(null, ['authors'], details),
      description: pipe(
        propOr([], ['descriptions']),
        head,
        propOr(null, ['text']),
      )(details),
      documentMainLanguage: propOr(null, 'mainLanguage', details),
      documentType: pathOr(null, ['type'], details),
      editor: pathOr(null, ['editor'], details),
      endPage: docInfoGetters.getEndPage(details),
      id: details.id,
      identifier: pathOr(null, ['identifier'], details),
      identifierType: pathOr(null, ['identifierType'], details),
      isNewDocument: false,
      // doesn't exist at the moment in the db, TODO
      issue: pathOr(null, ['issue'], details),
      library: pathOr(null, ['library'], details),
      massif: pathOr(null, ['massif'], details),
      partOf: docInfoGetters.getAndConvertParentDocument(details),
      publicationDate: propOr('', 'datePublication', details),
      regions: pathOr(null, ['regions'], details),
      startPage: docInfoGetters.getStartPage(details),
      subjects: pathOr(null, ['subjects'], details),
      title: pipe(propOr([], 'titles'), head, propOr(null, 'text'))(details),
      titleAndDescriptionLanguage: pipe(
        propOr([], 'titles'),
        head,
        propOr(null, 'language'),
      )(details),
    }),
    ...(resetIsValidated
      ? {
          isValidated: false,
          dateValidation: null,
        }
      : {}),
  };

  return isLoading || !isNil(error) ? (
    <CircularProgress />
  ) : (
    <DocumentSubmission defaultValues={defaultValues} />
  );
};

DocumentEdit.propTypes = {
  onSuccessfulUpdate: PropTypes.func,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  resetIsValidated: PropTypes.bool,
};

export default DocumentEdit;
