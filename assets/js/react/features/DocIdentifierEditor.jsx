import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import IdentifierEditor from '../components/appli/Document/DocumentForm/formElements/IdentifierEditor';
import { loadIdentifierTypes } from '../actions/IdentifierType';

const DocIdentifierEditor = ({
  documentType,
  contextIdentifierValueName,
  contextIdentifierTypeValueName,
}) => {
  const dispatch = useDispatch();
  const { identifierTypes: allIdentifierTypes } = useSelector(
    (state) => state.identifierType,
  );

  useEffect(() => {
    dispatch(loadIdentifierTypes());
  }, []);

  return (
    <IdentifierEditor
      allIdentifierTypes={allIdentifierTypes}
      contextIdentifierValueName={contextIdentifierValueName}
      contextIdentifierTypeValueName={contextIdentifierTypeValueName}
      documentType={documentType}
    />
  );
};

DocIdentifierEditor.propTypes = {
  documentType: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  contextIdentifierValueName: PropTypes.string.isRequired,
  contextIdentifierTypeValueName: PropTypes.string.isRequired,
};

export default DocIdentifierEditor;
