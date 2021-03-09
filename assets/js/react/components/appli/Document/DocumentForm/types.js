import PropTypes from 'prop-types';
import { values } from 'ramda';

import { DocumentTypes } from './DocumentTypesHelper';

// eslint-disable-next-line import/prefer-default-export
export const DocumentFormTypes = {
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
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
  id: PropTypes.number,
  address: PropTypes.string,
  highlights: PropTypes.shape({}),
  latitude: PropTypes.string,
  longitude: PropTypes.string,
  name: PropTypes.string,
  names: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        isMain: PropTypes.bool,
        language: PropTypes.string,
        text: PropTypes.string,
      }),
    ),
    PropTypes.string,
  ]),
  type: PropTypes.string,
});
export const authorsTypes = PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.number,
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
export const massifTypes = PropTypes.shape({ id: PropTypes.number });
export const partOfTypes = PropTypes.shape({});
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
  authorComment: PropTypes.string,
  partOf: partOfTypes,
  publicationDate: PropTypes.string,
  regions: regionsTypes,
  startPage: PropTypes.number,
  subjects: subjectsTypes,
  title: PropTypes.string,
  titleAndDescriptionLanguage: titleAndDescriptionLanguageTypes,
});
