import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import LanguageSelect from '../components/appli/Document/DocumentForm/formElements/LanguageSelect';
import { loadLanguages } from '../actions/Language';

const DocumentLanguageSelect = ({
  contextValueName,
  helperText,
  labelText,
  required,
}) => {
  const dispatch = useDispatch();
  const { languages: allLanguages } = useSelector((state) => state.language);

  useEffect(() => {
    dispatch(loadLanguages(true));
  }, []);

  return (
    <LanguageSelect
      allLanguages={allLanguages}
      contextValueName={contextValueName}
      helperText={helperText}
      labelText={labelText}
      required={required}
    />
  );
};

DocumentLanguageSelect.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  labelText: PropTypes.string,
  required: PropTypes.bool.isRequired,
};

export default DocumentLanguageSelect;
