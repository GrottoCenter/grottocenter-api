import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Button,
  FormControl,
  Step,
  StepLabel,
  Stepper as MuiStepper,
} from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import Translate from '../Translate';

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

// ===================================

const Stepper = ({
  currentFormStepId,
  formSteps,
  handleStepBack,
  handleStepNext,
  isNextStepButtonDisabled,
}) => {
  const isStepCompleted = (stepId) => {
    const step = formSteps.find((s) => s.id === stepId);
    return step.isValid;
  };

  return (
    <>
      <MuiStepper activeStep={currentFormStepId.id - 1} alternativeLabel>
        {formSteps.map((step) => (
          <Step key={step.id} completed={isStepCompleted(step.id)}>
            <StepLabel>
              <Translate>{step.name}</Translate>
            </StepLabel>
          </Step>
        ))}
      </MuiStepper>

      <ChangeStepWrapper>
        <PreviousStepButton
          disabled={currentFormStepId === 1}
          onClick={handleStepBack}
        />
        <NextStepButton
          disabled={isNextStepButtonDisabled}
          onClick={handleStepNext}
          style={{ float: 'right' }}
        />
      </ChangeStepWrapper>
    </>
  );
};

Stepper.propTypes = {
  currentFormStepId: PropTypes.number.isRequired,
  formSteps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      isValid: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  handleStepBack: PropTypes.func.isRequired,
  handleStepNext: PropTypes.func.isRequired,
  isNextStepButtonDisabled: PropTypes.bool.isRequired,
};

export default Stepper;
