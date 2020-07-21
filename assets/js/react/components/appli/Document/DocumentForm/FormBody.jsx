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
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
  currentFormStepId,
  onStepIsValidChange,
}) => {
  return (
    <>
      {currentFormStepId === 1 && (
        <Step1
          // Suggestions
          allAuthors={allAuthors}
          allSubjects={allSubjects}
          allLanguages={allLanguages}
          // Steps
          onStepIsValidChange={onStepIsValidChange}
          stepId={1}
        />
      )}

      {currentFormStepId === 2 && (
        <Step2
          // Suggestions
          allLanguages={allLanguages}
          allLibraries={allLibraries}
          allMassifs={allMassifs}
          allPartOf={allPartOf}
          allRegions={allRegions}
          // Steps
          onStepIsValidChange={onStepIsValidChange}
          stepId={2}
        />
      )}
      {currentFormStepId === 3 && (
        <Step3
          // Suggestions
          allIdentifierTypes={allIdentifierTypes}
          // Steps
          onStepIsValidChange={onStepIsValidChange}
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
  allLibraries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  allMassifs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  allRegions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  allSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ),
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
  onStepIsValidChange: PropTypes.func.isRequired,
};

export default FormBody;
