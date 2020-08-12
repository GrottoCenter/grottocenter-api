import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import IdentifierEditor from '../components/appli/Document/DocumentForm/formElements/IdentifierEditor';
import { loadIdentifierTypes } from '../actions/IdentifierType';

const DocIdentifierEditor = ({
  documentType,
  identifier,
  identifierType,
  setIdentifier,
  setIdentifierType,
}) => {
  const dispatch = useDispatch();
  const { identifierTypes: allIdentifierTypes } = useSelector(
    (state) => state.identifierType,
  );

  const handleIdentifierChange = (newIdentifier) => {
    if (newIdentifier === '') {
      setIdentifier(null);
    }
    setIdentifier(newIdentifier);
  };

  const handleIdentifierTypeChange = (newIdentifierTypeCode) => {
    const newIdType = allIdentifierTypes.find(
      (idType) => idType.code === newIdentifierTypeCode,
    );
    setIdentifierType(newIdType);
  };

  useEffect(() => {
    dispatch(loadIdentifierTypes());
  }, []);

  return (
    <IdentifierEditor
      allIdentifierTypes={allIdentifierTypes}
      documentType={documentType}
      identifier={identifier}
      identifierType={identifierType}
      handleIdentifierChange={handleIdentifierChange}
      handleIdentifierTypeChange={handleIdentifierTypeChange}
    />
  );
};

DocIdentifierEditor.propTypes = {
  documentType: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  identifier: PropTypes.string,
  identifierType: PropTypes.shape({
    code: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    regexp: PropTypes.string.isRequired,
  }),
  setIdentifier: PropTypes.func.isRequired,
  setIdentifierType: PropTypes.func.isRequired,
};

export default DocIdentifierEditor;
