import React, { useState, createContext } from 'react';
import PropTypes from 'prop-types';

export const defaultContext = {
  docAttributes: {
    authors: [],
    description: '',
    descriptionLanguage: null,
    documentMainLanguage: null,
    documentType: null,
    editor: null,
    endPage: 0,
    identifier: '',
    identifierType: null,
    issue: '',
    library: null,
    massif: null,
    pageComment: '',
    partOf: null,
    publicationDate: null,
    regions: [],
    startPage: 0,
    subjects: [],
    title: '',
    titleLanguage: null,
  },
  loading: false,
  updateAttribute: (attributeName, newValue) => {}, // eslint-disable-line no-unused-vars
};

export const DocumentFormContext = createContext(defaultContext);

const DocumentForm = ({ docAttributes, loading = true, children }) => {
  const [docFormState, setState] = useState(docAttributes);
  const updateAttribute = (attributeName, newValue) => {
    setState((prevState) => ({
      ...prevState,
      [attributeName]: newValue,
    }));
  };

  return (
    <DocumentFormContext.Provider
      value={{
        docAttributes: docFormState,
        loading,
        action: {},
        updateAttribute,
      }}
    >
      {children}
    </DocumentFormContext.Provider>
  );
};

export const docAttributesType = PropTypes.shape({
  authors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ).isRequired,
  description: PropTypes.string.isRequired,
  descriptionLanguage: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  documentMainLanguage: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  documentType: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  editor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  endPage: PropTypes.number.isRequired,
  identifier: PropTypes.string.isRequired,
  identifierType: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }),
  issue: PropTypes.string.isRequired,
  library: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  massif: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  pageComment: PropTypes.string.isRequired,
  partOf: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  publicationDate: PropTypes.instanceOf(Date),
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  startPage: PropTypes.number.isRequired,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ),
  title: PropTypes.string.isRequired,
  titleLanguage: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
});

DocumentForm.propTypes = {
  docAttributes: docAttributesType.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default DocumentForm;
