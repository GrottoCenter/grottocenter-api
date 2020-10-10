import React, { useState, createContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { pathOr, isNil, without, append, uniq, pipe, __ } from 'ramda';
import { isStepValid } from './formSteps/DocumentStepsHelper';
import { DocumentTypes } from './DocumentTypesHelper';

const defaultFormSteps = [
  { id: 1, name: 'General Information', isValid: false },
  { id: 2, name: 'Linked Information', isValid: false },
  { id: 3, name: 'Meta Information', isValid: false },
];

export const defaultContext = {
  docAttributes: {
    authors: [],
    description: '',
    documentMainLanguage: null,
    documentType: { id: DocumentTypes.UNKNOWN },
    editor: null,
    endPage: 0,
    identifier: '',
    identifierType: null,
    issue: '',
    library: null,
    massif: null,
    pageComment: '',
    partOf: null,
    publicationDate: null,
    regions: [],
    startPage: 0,
    subjects: [],
    title: '',
    titleAndDescriptionLanguage: null,
    formSteps: defaultFormSteps,
  },
  currentStep: 1,

  updateAttribute: (attributeName, newValue) => {}, // eslint-disable-line no-unused-vars
  resetContext: () => {},
};

export const DocumentFormContext = createContext(defaultContext);

const Provider = ({ children }) => {
  const [docFormState, setState] = useState(defaultContext.docAttributes);
  const [validatedSteps, setValidatedSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(
    pathOr(null, [0, 'id'], defaultFormSteps),
  );
  const [isFormValid, setIsFormValid] = useState(false);

  const updateAttribute = useCallback(
    (attributeName, newValue) => {
      setState((prevState) => ({
        ...prevState,
        [attributeName]: newValue,
      }));
    },
    [setState],
  );

  const resetContext = useCallback(() => {
    setState(defaultContext);
  });

  useEffect(() => {
    const invalidateSteps = without(__, validatedSteps);
    const validateStep = pipe(append(__, validatedSteps), uniq);
    if (!isNil(currentStep)) {
      if (isStepValid(currentStep, docFormState, docFormState.documentType)) {
        setValidatedSteps(validateStep(currentStep));
      } else {
        setValidatedSteps(invalidateSteps([currentStep]));
      }
    }
  }, [docFormState, currentStep]);

  useEffect(() => {
    setIsFormValid(defaultFormSteps.length === validatedSteps.length);
  }, [validatedSteps]);

  return (
    <DocumentFormContext.Provider
      value={{
        action: {},
        currentStep,
        docAttributes: docFormState,
        isFormValid,
        resetContext,
        updateAttribute,
        updateCurrentStep: setCurrentStep,
        validatedSteps,
      }}
    >
      {children}
    </DocumentFormContext.Provider>
  );
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Provider;
