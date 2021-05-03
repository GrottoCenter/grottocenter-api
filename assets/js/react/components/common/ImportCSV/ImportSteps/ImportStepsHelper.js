import { isNil } from 'ramda';

const isStep2Valid = (stepData, importData) => {
  if (isNil(stepData)) {
    return false;
  }

  const { baseErrors, fileImported } = stepData;

  return (
    Object.keys(baseErrors).length === 0 &&
    fileImported &&
    importData.length !== 0
  );
};

// currentStep must be the index +1
const isStepValid = (currentStep, stepData, importData) => {
  return currentStep === 2 ? isStep2Valid(stepData, importData) : true;
};

export default isStepValid;
