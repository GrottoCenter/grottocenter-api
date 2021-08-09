import React, { useContext, useEffect, useCallback } from 'react';
import { includes } from 'ramda';
import {
  Card,
  CardContent,
  Divider,
  makeStyles,
  Typography,
  LinearProgress as MuiLinearProgress,
} from '@material-ui/core';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import ImportTabs from './ImportTabs';
import Stepper from '../../common/Form/Stepper';
import Provider, { ImportPageContentContext } from './Provider';
import ImportPageContent from './ImportPageContent';
import Translate from '../../common/Translate';
import { useBoolean } from '../../../hooks';
import { ENTRANCE } from './constants';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },

  stepper: {
    margin: '0 0 1rem 0',
  },
});

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const StyledDivider = styled(Divider)`
  margin: ${({ theme }) => theme.spacing(3)}px;
`;

const ImportContainer = () => {
  const classes = useStyles();
  const {
    isTrue: isNextStepDisabled,
    true: enableNextStep,
    false: disableNextStep,
  } = useBoolean(true);
  const { isLoading } = useSelector((state) => state.importCsv);

  const {
    currentStep: currentFormStep,
    validatedSteps,
    updateCurrentStep,
    selectedType,
    importAttributes: { formSteps },
  } = useContext(ImportPageContentContext);

  const handleStepNext = useCallback(() => {
    updateCurrentStep((prevFormStep) => prevFormStep + 1);
  }, [updateCurrentStep]);

  const handleStepBack = useCallback(() => {
    updateCurrentStep((prevFormStep) => prevFormStep - 1);
  }, [updateCurrentStep]);

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    currentFormStep === formSteps.length ||
    !includes(currentFormStep, validatedSteps)
      ? enableNextStep()
      : disableNextStep();
  }, [validatedSteps, currentFormStep, formSteps]);

  return (
    <>
      <ImportTabs />
      <Card className={classes.root}>
        <CardContent>
          <Typography color="secondary" variant="h1">
            {selectedType === ENTRANCE ? (
              <Translate>Entrances import</Translate>
            ) : (
              <Translate>Documents import</Translate>
            )}
          </Typography>
          <LinearProgress $isLoading={isLoading} />

          <div style={isLoading ? { opacity: '0.6' } : {}}>
            <Stepper
              className={classes.stepper}
              currentFormStepId={currentFormStep}
              completedSteps={validatedSteps}
              formSteps={formSteps}
              isNextStepButtonDisabled={isNextStepDisabled}
              handleStepBack={handleStepBack}
              handleStepNext={handleStepNext}
            />
            <StyledDivider />
            <ImportPageContent currentFormStepId={currentFormStep} />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
const HydratedImportContainer = () => (
  <Provider>
    <ImportContainer />
  </Provider>
);

HydratedImportContainer.propTypes = {};

export default HydratedImportContainer;
