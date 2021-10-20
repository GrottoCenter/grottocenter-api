import React from 'react';
import PropTypes from 'prop-types';
import Step1 from './ImportSteps/Step1';
import Step2 from './ImportSteps/Step2';
import Step3 from './ImportSteps/Step3';
import Step4 from './ImportSteps/Step4';

const ImportPageContent = ({ currentFormStepId }) => {
  return (
    <>
      {currentFormStepId === 1 && <Step1 stepId={1} />}
      {currentFormStepId === 2 && <Step2 stepId={2} />}
      {currentFormStepId === 3 && <Step3 stepId={3} />}
      {currentFormStepId === 4 && <Step4 stepId={4} />}
    </>
  );
};

ImportPageContent.propTypes = {
  currentFormStepId: PropTypes.number.isRequired,
};

export default ImportPageContent;
