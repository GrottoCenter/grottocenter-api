import React from 'react';
import PropTypes from 'prop-types';

import Step1 from './formSteps/Step1';
import Step2 from './formSteps/Step2';
import Step3 from './formSteps/Step3';

// ===================================

const FormBody = ({
  allAuthors,
  allIdentifierTypes,
  allLanguages,
  allPartOf,
  currentFormStepId,
}) => {
  return (
    <>
      {currentFormStepId === 1 && (
        <Step1
          // Suggestions
          allLanguages={allLanguages}
          // Steps
          stepId={1}
        />
      )}

      {currentFormStepId === 2 && (
        <Step2
          // Suggestions
          allAuthors={allAuthors}
          allLanguages={allLanguages}
          allPartOf={allPartOf}
          // Steps
          stepId={2}
        />
      )}
      {currentFormStepId === 3 && (
        <Step3
          // Suggestions
          allIdentifierTypes={allIdentifierTypes}
          // Steps
          stepId={3}
        />
      )}
    </>
  );
};

FormBody.propTypes = {
  allAuthors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ).isRequired,
  allIdentifierTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ),
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  allPartOf: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      issue: PropTypes.string,
      documenType: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
      partOf: PropTypes.shape({}),
    }),
  ),

  currentFormStepId: PropTypes.number.isRequired,
};

export default FormBody;
