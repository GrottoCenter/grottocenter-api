import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Button,
  Divider,
  FormControl,
  Step,
  StepLabel,
  Stepper,
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
  allEditors,
  allIdentifierTypes,
  allLanguages,
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
  // Doc attributes
  authors,
  description,
  descriptionLanguage,
  documentMainLanguage,
  documentType,
  editor,
  endPage,
  identifier,
  identifierType,
  issue,
  library,
  massif,
  pageComment,
  partOf,
  publicationDate,
  regions,
  startPage,
  subjects,
  title,
  titleLanguage,
  // onChange functions
  onAuthorsChange,
  onDescriptionChange,
  onDescriptionLanguageChange,
  onDocumentMainLanguageChange,
  onDocumentTypeChange,
  onEditorChange,
  onEndPageChange,
  onIdentifierChange,
  onIdentifierTypeChange,
  onIssueChange,
  onLibraryChange,
  onMassifChange,
  onPageCommentChange,
  onPartOfChange,
  onPublicationDateChange,
  onRegionsChange,
  onStartPageChange,
  onSubjectsChange,
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
      <LinearProgress
        // visibility is used to keep the space needed for the LinearProgress
        // even if it's not shown.
        style={isLoading ? { visibility: 'visible' } : { visibility: 'hidden' }}
      />
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
            // Suggestions
            allAuthors={allAuthors}
            allSubjects={allSubjects}
            allLanguages={allLanguages}
            // Doc attributes
            authors={authors}
            description={description}
            descriptionLanguage={descriptionLanguage}
            documentMainLanguage={documentMainLanguage}
            documentType={documentType}
            publicationDate={publicationDate}
            subjects={subjects}
            title={title}
            titleLanguage={titleLanguage}
            // onChange functions
            onAuthorsChange={onAuthorsChange}
            onDescriptionChange={onDescriptionChange}
            onDescriptionLanguageChange={onDescriptionLanguageChange}
            onDocumentMainLanguageChange={onDocumentMainLanguageChange}
            onDocumentTypeChange={onDocumentTypeChange}
            onPublicationDateChange={onPublicationDateChange}
            onTitleChange={onTitleChange}
            onTitleLanguageChange={onTitleLanguageChange}
            onSubjectsChange={onSubjectsChange}
            // Steps
            onStepIsValidChange={onStepIsValidChange}
            stepId={1}
          />
        )}

        {getFormStep(currentFormStepId).id === 2 && (
          <Step2
            // Suggestions
            allEditors={allEditors}
            allLanguages={allLanguages}
            allLibraries={allLibraries}
            allMassifs={allMassifs}
            allPartOf={allPartOf}
            allRegions={allRegions}
            // Doc attributes
            documentType={documentType}
            editor={editor}
            library={library}
            massif={massif}
            partOf={partOf}
            regions={regions}
            // onChange functions
            onEditorChange={onEditorChange}
            onLibraryChange={onLibraryChange}
            onMassifChange={onMassifChange}
            onPartOfChange={onPartOfChange}
            onRegionsChange={onRegionsChange}
            // Steps
            onStepIsValidChange={onStepIsValidChange}
            stepId={2}
          />
        )}
        {getFormStep(currentFormStepId).id === 3 && (
          <Step3
            // Suggestions
            allIdentifierTypes={allIdentifierTypes}
            // Doc attributes
            documentType={documentType}
            endPage={endPage}
            identifier={identifier}
            identifierType={identifierType}
            issue={issue}
            pageComment={pageComment}
            startPage={startPage}
            // onChange functions
            onEndPageChange={onEndPageChange}
            onIdentifierChange={onIdentifierChange}
            onIdentifierTypeChange={onIdentifierTypeChange}
            onIssueChange={onIssueChange}
            onPageCommentChange={onPageCommentChange}
            onStartPageChange={onStartPageChange}
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
  allEditors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
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

  // Document attributes
  authors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      surname: PropTypes.string.isRequired,
    }),
  ).isRequired,
  description: PropTypes.string.isRequired,
  descriptionLanguage: PropTypes.string.isRequired,
  documentMainLanguage: PropTypes.string.isRequired,
  documentType: PropTypes.number.isRequired,
  editor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  endPage: PropTypes.number.isRequired,
  identifier: PropTypes.string.isRequired,
  identifierType: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }),
  issue: PropTypes.string.isRequired,
  library: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  massif: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  pageComment: PropTypes.string.isRequired,
  partOf: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  publicationDate: PropTypes.instanceOf(Date),
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  startPage: PropTypes.number.isRequired,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
    }),
  ),
  title: PropTypes.string.isRequired,
  titleLanguage: PropTypes.string.isRequired,

  // On change functions
  onAuthorsChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onDescriptionLanguageChange: PropTypes.func.isRequired,
  onDocumentMainLanguageChange: PropTypes.func.isRequired,
  onDocumentTypeChange: PropTypes.func.isRequired,
  onEditorChange: PropTypes.func.isRequired,
  onEndPageChange: PropTypes.func.isRequired,
  onIdentifierChange: PropTypes.func.isRequired,
  onIdentifierTypeChange: PropTypes.func.isRequired,
  onIssueChange: PropTypes.func.isRequired,
  onLibraryChange: PropTypes.func.isRequired,
  onMassifChange: PropTypes.func.isRequired,
  onPageCommentChange: PropTypes.func.isRequired,
  onPartOfChange: PropTypes.func.isRequired,
  onPublicationDateChange: PropTypes.func.isRequired,
  onRegionsChange: PropTypes.func.isRequired,
  onStartPageChange: PropTypes.func.isRequired,
  onSubjectsChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onTitleLanguageChange: PropTypes.func.isRequired,
};

export default DocumentForm;
