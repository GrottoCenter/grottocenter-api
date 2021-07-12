import React, { useContext, useEffect } from 'react';
import { includes } from 'ramda';
import { Card, CardContent, makeStyles, Typography, LinearProgress as MuiLinearProgress, } from '@material-ui/core';
import ImportTabs from './ImportTabs';
import Stepper from '../Form/Stepper';
import Provider, { ImportPageContentContext } from './Provider';
import ImportPageContent from './ImportPageContent';
import Translate from '../Translate';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },

  stepper: {
    margin: '0 0 1rem 0',
  },
});

const ImportContainer = () => {
  const classes = useStyles();
  const [isNextStepDisabled, setIsNextStepDisabled] = React.useState(true);
  const { isLoading } = useSelector((state) => state.importCsv)

  const {
    currentStep: currentFormStep,
    validatedSteps,
    updateCurrentStep,
    selectedType,
    importAttributes: { formSteps },
  } = useContext(ImportPageContentContext);

  const handleStepNext = () => {
    updateCurrentStep((prevFormStep) => prevFormStep + 1);
  };

  const handleStepBack = () => {
    updateCurrentStep((prevFormStep) => prevFormStep - 1);
  };

  useEffect(() => {
    setIsNextStepDisabled(
      currentFormStep === formSteps.length ||
        !includes(currentFormStep, validatedSteps),
    );
  }, [validatedSteps, currentFormStep, formSteps, setIsNextStepDisabled]);

  const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

  return (
    <>
      <ImportTabs />
      <Card className={classes.root}>
        <CardContent>
          <Typography variant="h6">
            {selectedType === 0 ? (
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
