import React from 'react';
import PropTypes from 'prop-types';

import DescriptionEditor from '../formElements/DescriptionEditor';

// ===================================

const Step2 = ({
  allLanguages,
  // Doc attributes
  description,
  descriptionLanguage,
  // onChange functions
  onDescriptionChange,
  onDescriptionLanguageChange,

  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    const newIsValid = description !== '' && descriptionLanguage !== '';
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
      onStepIsValidChange(stepId, newIsValid);
    }
  });

  return (
    <DescriptionEditor
      allLanguages={allLanguages}
      description={description}
      onDescriptionChange={onDescriptionChange}
      language={descriptionLanguage}
      languageHelperText="Some helper text for Description Language"
      languageItemReferringTo="Description"
      onLanguageChange={onDescriptionLanguageChange}
    />
  );
};

Step2.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,

  // Document attributes
  description: PropTypes.string.isRequired,
  descriptionLanguage: PropTypes.string.isRequired,

  // On change functions
  onDescriptionChange: PropTypes.func.isRequired,
  onDescriptionLanguageChange: PropTypes.func.isRequired,

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step2;
