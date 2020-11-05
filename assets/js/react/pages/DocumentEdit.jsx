import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, head, omit, pathOr, propOr, reject, pipe, unless } from 'ramda';
import DocumentSubmission from './DocumentSubmission';
import { fetchDocumentDetails } from '../actions/DocumentDetails';

const DocumentEdit = ({ id }) => {
  const dispatch = useDispatch();
  const { isLoading, details, error } = useSelector(
    (state) => state.documentDetails,
  );

  useEffect(() => {
    if (!isNil(id)) {
      dispatch(fetchDocumentDetails(id));
    }
  }, [id]);

  const getAndConvertParentDocument = (fullDocument) => {
    const parent = pathOr(null, ['parent'], fullDocument);
    if (parent) {
      return {
        // Convert parent "type" to "documentType" and get name from "titles"
        documentType: {
          id: propOr(null, 'type', parent),
        },
        name: pipe(
          propOr([], ['titles']),
          head,
          propOr(null, ['text']),
        )(parent),
        ...omit(['type', 'titles'], parent),
      };
    }
    return parent;
  };

  const getStartPage = (fullDocument) => {
    const { pages } = fullDocument;
    if (!pages) {
      return null;
    }
    const result = pages.split(/[-,]/)[0];
    if (result === '') {
      return null;
    }
    return result;
  };

  const getEndPage = (fullDocument) => {
    const { pages } = fullDocument;
    if (!pages) {
      return null;
    }
    const result = pages.split(/[-,]/)[1];
    if (result === '' || !result) {
      return null;
    }
    return result;
  };

  return isLoading || !isNil(error) ? (
    <CircularProgress />
  ) : (
    <DocumentSubmission
      defaultValues={reject(isNil, {
        authors: pathOr(null, ['authors'], details),
        description: pipe(
          propOr([], ['descriptions']),
          head,
          propOr(null, ['text']),
        )(details),
        documentMainLanguage: propOr(null, 'mainLanguage', details),
        documentType: pathOr(null, ['type'], details),
        editor: pathOr(null, ['editor'], details),
        endPage: getEndPage(details),
        identifier: pathOr(null, ['identifier'], details),
        identifierType: pathOr(null, ['identifierType'], details),
        // doesn't exist at the moment in the db, TODO
        issue: pathOr(null, ['issue'], details),
        library: pathOr(null, ['library'], details),
        massif: pathOr(null, ['massif'], details),
        // doesn't exist at the moment in the db, TODO
        pageComment: null,
        partOf: getAndConvertParentDocument(details),
        publicationDate: pipe(
          pathOr(null, ['datePublication']),
          unless(isNil, (date) => new Date(date)),
        )(details),
        regions: pathOr(null, ['regions'], details),
        startPage: getStartPage(details),
        subjects: pathOr(null, ['subjects'], details),
        title: pipe(propOr([], 'titles'), head, propOr(null, 'text'))(details),
        titleAndDescriptionLanguage: pipe(
          propOr([], 'titles'),
          head,
          propOr(null, 'language'),
        )(details),
      })}
    />
  );
};

DocumentEdit.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default DocumentEdit;
