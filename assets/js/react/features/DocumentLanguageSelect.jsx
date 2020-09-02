import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import LanguageSelect from '../components/appli/Document/DocumentForm/formElements/LanguageSelect';
import { loadLanguages } from '../actions/Language';

const DocumentLanguageSelect = ({
  helperText,
  labelText,
  language,
  required,
  setLanguage,
}) => {
  const dispatch = useDispatch();
  const { languages: allLanguages } = useSelector((state) => state.language);

  const handleLanguageChange = (newLanguage) => {
    if (newLanguage === null) {
      setLanguage(null);
    }
    setLanguage(newLanguage);
  };

  useEffect(() => {
    dispatch(loadLanguages(true));
  }, []);

  return (
    <LanguageSelect
      allLanguages={allLanguages}
      language={language}
      handleLanguageChange={handleLanguageChange}
      helperText={helperText}
      labelText={labelText}
      required={required}
    />
  );
};

DocumentLanguageSelect.propTypes = {
  helperText: PropTypes.string,
  labelText: PropTypes.string,
  language: PropTypes.string,
  required: PropTypes.bool.isRequired,
  setLanguage: PropTypes.func.isRequired,
};

export default DocumentLanguageSelect;
