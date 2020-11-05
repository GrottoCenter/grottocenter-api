import PropTypes from 'prop-types';
import { values } from 'ramda';

import { DocumentTypes } from './DocumentTypesHelper';

// eslint-disable-next-line import/prefer-default-export
export const DocumentFormTypes = {
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

// eslint-disable-next-line import/prefer-default-export
const languageTypes = PropTypes.shape({
  id: PropTypes.string,
  part2b: PropTypes.string,
  part2t: PropTypes.string,
  part1: PropTypes.string,
  refName: PropTypes.string,
  scope: PropTypes.string,
  type: PropTypes.string,
  isPrefered: PropTypes.bool,
});
const organizationTypes = PropTypes.shape({
  id: PropTypes.string,
  address: PropTypes.string,
  highlights: PropTypes.shape({}),
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  name: PropTypes.string,
  names: PropTypes.string,
  type: PropTypes.string,
});
export const authorsTypes = PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.string,
    mail: PropTypes.string,
    name: PropTypes.string,
    nickname: PropTypes.string,
    surname: PropTypes.string,
    type: PropTypes.string,
  }),
);
export const documentMainLanguageTypes = languageTypes;
export const documentTypeTypes = PropTypes.shape({
  id: PropTypes.oneOf(values(DocumentTypes)),
  name: PropTypes.string,
});

export const editorTypes = organizationTypes;
export const libraryTypes = organizationTypes;
export const identifierTypeTypes = PropTypes.shape({});
export const massifTypes = PropTypes.shape({ id: PropTypes.string });
export const partOfTypes = PropTypes.shape({});
export const publicationDateTypes = PropTypes.instanceOf(Date);
export const regionsTypes = PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
    country: PropTypes.string,
    name: PropTypes.string,
    isDeprecated: PropTypes.bool,
  }),
);
export const subjectsTypes = PropTypes.arrayOf(
  PropTypes.shape({
    code: PropTypes.string,
    parent: PropTypes.shape({}),
    subject: PropTypes.string,
  }),
);
export const titleAndDescriptionLanguageTypes = languageTypes;

export const defaultValuesTypes = PropTypes.shape({
  authors: authorsTypes,
  description: PropTypes.string,
  documentMainLanguage: documentMainLanguageTypes,
  documentType: documentTypeTypes,
  editor: editorTypes,
  endPage: PropTypes.number,
  identifier: PropTypes.string,
  identifierType: identifierTypeTypes,
  issue: PropTypes.string,
  library: libraryTypes,
  massif: massifTypes,
  pageComment: PropTypes.string,
  partOf: partOfTypes,
  publicationDate: publicationDateTypes,
  regions: regionsTypes,
  startPage: PropTypes.number,
  subjects: subjectsTypes,
  title: PropTypes.string,
  titleAndDescriptionLanguage: titleAndDescriptionLanguageTypes,
});
