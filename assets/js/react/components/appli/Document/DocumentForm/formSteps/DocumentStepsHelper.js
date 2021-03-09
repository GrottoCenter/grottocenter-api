import { isNil } from 'ramda';
import { DocumentTypes } from '../DocumentTypesHelper';

const isStep1Valid = (stepData, documentType) => {
  if (isNil(stepData)) {
    return false;
  }
  const {
    title,
    titleAndDescriptionLanguage,
    documentMainLanguage,
    description,
    publicationDate,
  } = stepData;
  const isValid =
    title !== '' && titleAndDescriptionLanguage !== null && description !== '';

  switch (documentType.id) {
    case DocumentTypes.UNKNOWN:
      return false;
    case DocumentTypes.ISSUE:
      return isValid && publicationDate !== '' && documentMainLanguage !== null;
    case DocumentTypes.ARTICLE:
      return isValid && documentMainLanguage !== null;
    case DocumentTypes.COLLECTION:
      return isValid && documentMainLanguage !== null;
    case DocumentTypes.IMAGE:
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
    case DocumentTypes.ISSUE:
      return editor !== null && partOf !== null;
    case DocumentTypes.ARTICLE:
      return authors.length > 0 && subjects.length > 0;
    case DocumentTypes.IMAGE:
    default:
      return authors.length > 0;
  }
};

const isStep3Valid = (stepData) => {
  if (isNil(stepData)) {
    return false;
  }
  const { identifier, identifierType, startPage, endPage } = stepData;

  let pagesAreOk = true;
  if (startPage || endPage) {
    pagesAreOk =
      (startPage > 0 && endPage > 0 && endPage > startPage) ||
      (!startPage && endPage > 0);
  }

  let regexpValidation = false;
  if (identifierType !== null) {
    const regexp = new RegExp(identifierType.regexp);
    regexpValidation = regexp.test(identifier);
  }

  return (
    pagesAreOk &&
    (identifier === '' ||
      (identifier !== '' && identifierType !== null && regexpValidation))
  );
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
    case 4: // case 4 is whole submission recap => it's always valid
      return true;
    default:
      return false;
  }
};
