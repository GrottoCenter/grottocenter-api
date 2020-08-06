import React from 'react';
import PropTypes from 'prop-types';
import { includes } from 'ramda';
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
  completedSteps,
  handleStepBack,
  handleStepNext,
  isNextStepButtonDisabled,
}) => (
  <>
    <MuiStepper activeStep={currentFormStepId.id - 1} alternativeLabel>
      {formSteps.map((step) => (
        <Step
          key={step.id}
          active={step.id === currentFormStepId}
          completed={includes(step.id, completedSteps)}
        >
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

Stepper.propTypes = {
  currentFormStepId: PropTypes.number.isRequired,
  formSteps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  completedSteps: PropTypes.arrayOf(PropTypes.number).isRequired,
  handleStepBack: PropTypes.func.isRequired,
  handleStepNext: PropTypes.func.isRequired,
  isNextStepButtonDisabled: PropTypes.bool.isRequired,
};

export default Stepper;
