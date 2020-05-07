import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Button,
  Divider,
  FormControl,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import Translate from '../../Translate';

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
  { id: 1, name: 'Title & Identifiers' },
  { id: 2, name: 'Description' },
  { id: 3, name: 'Misc' },
];
const getFormStep = (index) => {
  return formSteps.find((step) => step.id === index);
};

// ===================================

const DocumentForm = ({
  allLanguages,
  // Doc attributes
  description,
  descriptionLanguage,
  documentMainLanguage,
  identifier,
  isFromBbs,
  issue,
  publicationDate,
  reference,
  title,
  titleLanguage,
  // onChange functions
  onDescriptionChange,
  onDescriptionLanguageChange,
  onDocumentMainLanguageChange,
  onIdentifierChange,
  onIsFromBbsChange,
  onIssueChange,
  onPublicationDateChange,
  onReferenceChange,
  onSubmit,
  onTitleChange,
  onTitleLanguageChange,
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

  return (
    <>
      <Typography variant="h1">
        <Translate>Document Submission form</Translate>
      </Typography>

      <Stepper
        activeStep={getFormStep(currentFormStepId).id - 1}
        alternativeLabel
      >
        {formSteps.map((step) => (
          <Step
            key={step.id}
            completed={validSteps.find((s) => s.id === step.id).isValid}
          >
            <StepLabel>{step.name}</StepLabel>
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
            allLanguages={allLanguages}
            documentMainLanguage={documentMainLanguage}
            identifier={identifier}
            reference={reference}
            title={title}
            titleLanguage={titleLanguage}
            onDocumentMainLanguageChange={onDocumentMainLanguageChange}
            onIdentifierChange={onIdentifierChange}
            onReferenceChange={onReferenceChange}
            onTitleChange={onTitleChange}
            onTitleLanguageChange={onTitleLanguageChange}
            onStepIsValidChange={onStepIsValidChange}
            stepId={1}
          />
        )}

        {getFormStep(currentFormStepId).id === 2 && (
          <Step2
            allLanguages={allLanguages}
            description={description}
            descriptionLanguage={descriptionLanguage}
            onDescriptionChange={onDescriptionChange}
            onDescriptionLanguageChange={onDescriptionLanguageChange}
            onStepIsValidChange={onStepIsValidChange}
            stepId={2}
          />
        )}
        {getFormStep(currentFormStepId).id === 3 && (
          <Step3
            isFromBbs={isFromBbs}
            issue={issue}
            publicationDate={publicationDate}
            onIsFromBbsChange={onIsFromBbsChange}
            onIssueChange={onIssueChange}
            onPublicationDateChange={onPublicationDateChange}
            onStepIsValidChange={onStepIsValidChange}
            stepId={3}
          />
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
    </>
  );
};

DocumentForm.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,

  // Document attributes
  description: PropTypes.string.isRequired,
  descriptionLanguage: PropTypes.string.isRequired,
  documentMainLanguage: PropTypes.string.isRequired,
  identifier: PropTypes.string.isRequired,
  isFromBbs: PropTypes.bool.isRequired,
  issue: PropTypes.string.isRequired,
  publicationDate: PropTypes.instanceOf(Date),
  reference: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  titleLanguage: PropTypes.string.isRequired,

  // On change functions
  onDescriptionChange: PropTypes.func.isRequired,
  onDescriptionLanguageChange: PropTypes.func.isRequired,
  onDocumentMainLanguageChange: PropTypes.func.isRequired,
  onIdentifierChange: PropTypes.func.isRequired,
  onIsFromBbsChange: PropTypes.func.isRequired,
  onIssueChange: PropTypes.func.isRequired,
  onPublicationDateChange: PropTypes.func.isRequired,
  onReferenceChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onTitleLanguageChange: PropTypes.func.isRequired,
};

export default DocumentForm;
