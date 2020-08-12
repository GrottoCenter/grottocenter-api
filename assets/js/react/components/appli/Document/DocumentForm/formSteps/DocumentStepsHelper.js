import { isNil } from 'ramda';
import { DocumentTypes } from '../DocumentTypesHelper';

const isStep1Valid = (stepData, documentType) => {
  if (isNil(stepData)) {
    return false;
  }
  const {
    title,
    titleLanguage,
    description,
    descriptionLanguage,
    publicationDate,
  } = stepData;
  const isValid =
    title !== '' &&
    titleLanguage !== null &&
    description !== '' &&
    descriptionLanguage !== null;

  switch (documentType.id) {
    case DocumentTypes.UNKNOWN:
      return false;
    case DocumentTypes.COLLECTION_ELEMENT:
      return isValid && publicationDate !== null;
    case DocumentTypes.IMAGE:
    case DocumentTypes.TEXT:
    case DocumentTypes.COLLECTION:
    default:
      return isValid;
  }
};

const isStep2Valid = (stepData, documentType) => {
  if (isNil(stepData)) {
    return false;
  }
  const { editor, partOf, authors, subjects } = stepData;

  switch (documentType.id) {
    case DocumentTypes.UNKNOWN:
      return false;
    case DocumentTypes.COLLECTION:
      return editor !== null;
    case DocumentTypes.COLLECTION_ELEMENT:
      return editor !== null && partOf !== null;
    case DocumentTypes.IMAGE:
      return authors.length > 0;
    case DocumentTypes.TEXT:
      return /* authors.length > 0 && */ subjects.length > 0;
    default:
      return true;
  }
};

const isStep3Valid = (stepData) => {
  if (isNil(stepData)) {
    return false;
  }
  const { identifier, identifierType } = stepData;

  return identifier === '' || (identifier !== '' && identifierType !== null);
};

// currentStep must be the index +1
// eslint-disable-next-line import/prefer-default-export
export const isStepValid = (currentStep, stepData, documentType) => {
  switch (currentStep) {
    case 1:
      return isStep1Valid(stepData, documentType);
    case 2:
      return isStep2Valid(stepData, documentType);
    case 3:
      return isStep3Valid(stepData);
    default:
      return false;
  }
};
