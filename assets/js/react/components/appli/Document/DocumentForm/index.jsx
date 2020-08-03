import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Button,
  Divider,
  FormControl,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import Translate from '../../../common/Translate';

import Step1 from './formSteps/Step1';
import Step2 from './formSteps/Step2';
import Step3 from './formSteps/Step3';

// ===================================
const NextStepButton = (props) => (
  <Button
    {...props}
    variant="contained"
    color="primary"
    endIcon={<NavigateNextIcon />}
  >
    <Translate>Next</Translate>
  </Button>
);

const PreviousStepButton = (props) => (
  <Button
    {...props}
    variant="contained"
    color="primary"
    startIcon={<NavigateBeforeIcon />}
  >
    <Translate>Back</Translate>
  </Button>
);

const ChangeStepWrapper = styled(FormControl)`
  display: block;
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledDivider = styled(Divider)`
  margin: ${({ theme }) => theme.spacing(3)}px 0;
`;

const SubmitButton = styled(Button)`
  display: block;
  margin: auto;
`;

// ===================================

const formSteps = [
  { id: 1, name: 'General Information' },
  { id: 2, name: 'Linked Information' },
  { id: 3, name: 'Meta Information' },
];
const getFormStep = (index) => {
  return formSteps.find((step) => step.id === index);
};

// ===================================

const DocumentForm = ({
  allAuthors,
  allIdentifierTypes,
  allLanguages,
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
  isLoading,
  onSubmit,
}) => {
  const [currentFormStepId, setCurrentFormStepId] = React.useState(
    formSteps[0].id,
  );
  const [validSteps, setValidSteps] = React.useState(
    formSteps.map((step) => ({ ...step, isValid: false })),
  );

  const onStepIsValidChange = (stepId, isValid) => {
    const newValidSteps = validSteps.map((s) => {
      const newStep = s;
      if (newStep.id === stepId) {
        newStep.isValid = isValid;
      }
      return newStep;
    });
    if (newValidSteps !== validSteps) {
      setValidSteps(newValidSteps);
    }
  };

  const isNextStepButtonDisabled = () => {
    const lastStep = currentFormStepId === formSteps.length;
    const currentStep = validSteps.find((s) => s.id === currentFormStepId);
    return lastStep || !currentStep.isValid;
  };

  const handleStepNext = () => {
    setCurrentFormStepId((prevFormStep) => prevFormStep + 1);
  };

  const handleStepBack = () => {
    setCurrentFormStepId((prevFormStep) => prevFormStep - 1);
  };

  const isStepCompleted = (stepId) => {
    const step = validSteps.find((s) => s.id === stepId);
    return step.isValid;
  };

  // visibility is used to keep the space needed for the LinearProgress
  // even if it's not shown.
  const LinearProgressVisibleOrNot = styled(LinearProgress)`
    visibility: ${isLoading ? 'visible' : 'hidden'};
  `;

  return (
    <>
      <LinearProgressVisibleOrNot />
      <div style={isLoading ? { opacity: '0.6' } : {}}>
        <Stepper
          activeStep={getFormStep(currentFormStepId).id - 1}
          alternativeLabel
        >
          {formSteps.map((step) => (
            <Step key={step.id} completed={isStepCompleted(step.id)}>
              <StepLabel>
                <Translate>{step.name}</Translate>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <ChangeStepWrapper>
          <PreviousStepButton
            disabled={currentFormStepId === 1}
            onClick={handleStepBack}
          />
          <NextStepButton
            disabled={isNextStepButtonDisabled()}
            onClick={handleStepNext}
            style={{ float: 'right' }}
          />
        </ChangeStepWrapper>

        <StyledDivider />

        <FormWrapper onSubmit={onSubmit}>
          {getFormStep(currentFormStepId).id === 1 && (
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

          {getFormStep(currentFormStepId).id === 2 && (
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
          {getFormStep(currentFormStepId).id === 3 && (
            <Step3
              // Suggestions
              allIdentifierTypes={allIdentifierTypes}
              // Steps
              onStepIsValidChange={onStepIsValidChange}
              stepId={3}
            />
          )}

          {isMobileOnly && (
            <ChangeStepWrapper>
              <PreviousStepButton
                disabled={currentFormStepId === 1}
                onClick={handleStepBack}
              />
              <NextStepButton
                disabled={isNextStepButtonDisabled()}
                onClick={handleStepNext}
                style={{ float: 'right' }}
              />
            </ChangeStepWrapper>
          )}

          {currentFormStepId === formSteps.length && (
            <FormControl>
              <SubmitButton
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={validSteps.some((s) => !s.isValid)}
              >
                <Translate>Submit</Translate>
              </SubmitButton>
            </FormControl>
          )}
        </FormWrapper>
      </div>
    </>
  );
};

DocumentForm.propTypes = {
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

  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default DocumentForm;
