import React, { useContext } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Button,
  Divider,
  FormControl,
  LinearProgress as MuiLinearProgress,
} from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';

import DocumentFormProvider, {
  defaultContext,
  DocumentFormContext,
} from './Provider';

import { postDocument } from '../../../../actions/Document';
import Translate from '../../../common/Translate';
import Stepper from '../../../common/Form/Stepper';

import FormBody from './FormBody';

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

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};
`;

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
}) => {
  const { docAttributes } = useContext(DocumentFormContext);
  const { formSteps } = docAttributes;
  const dispatch = useDispatch();

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(postDocument(docAttributes));
  };

  const [currentFormStepId, setCurrentFormStepId] = React.useState(
    formSteps[0].id,
  );

  const [
    isNextStepButtonDisabled,
    setIsNextStepButtonDisabled,
  ] = React.useState(true);

  const [isFormValid, setIsFormValid] = React.useState(false);

  const updateIsNextStepButtonDisabled = () => {
    const lastStep = currentFormStepId === formSteps.length;
    const currentStep = formSteps.find((s) => s.id === currentFormStepId);
    setIsNextStepButtonDisabled(lastStep || !currentStep.isValid);
  };

  const onStepIsValidChange = (stepId, isValid) => {
    const stepToUpdate = formSteps.find((step) => step.id === stepId);
    stepToUpdate.isValid = isValid;
    setIsFormValid(formSteps.every((step) => step.isValid));
    updateIsNextStepButtonDisabled();
  };

  React.useEffect(() => {
    updateIsNextStepButtonDisabled();
  }, [currentFormStepId]);

  const handleStepNext = () => {
    setCurrentFormStepId((prevFormStep) => prevFormStep + 1);
  };

  const handleStepBack = () => {
    setCurrentFormStepId((prevFormStep) => prevFormStep - 1);
  };

  return (
    <DocumentFormProvider docAttributes={defaultContext.docAttributes}>
      <LinearProgress />
      <div style={isLoading ? { opacity: '0.6' } : {}}>
        <Stepper
          currentFormStepId={currentFormStepId}
          formSteps={formSteps}
          isNextStepButtonDisabled={isNextStepButtonDisabled}
          handleStepBack={handleStepBack}
          handleStepNext={handleStepNext}
        />

        <StyledDivider />

        <FormWrapper onSubmit={onSubmit}>
          <FormBody
            allAuthors={allAuthors}
            allIdentifierTypes={allIdentifierTypes}
            allLanguages={allLanguages}
            allLibraries={allLibraries}
            allMassifs={allMassifs}
            allPartOf={allPartOf}
            allRegions={allRegions}
            allSubjects={allSubjects}
            formSteps={formSteps}
            currentFormStepId={currentFormStepId}
            onStepIsValidChange={onStepIsValidChange}
          />

          {isMobileOnly && (
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
          )}

          {currentFormStepId === formSteps.length && (
            <FormControl>
              <SubmitButton
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={!isFormValid}
              >
                <Translate>Submit</Translate>
              </SubmitButton>
            </FormControl>
          )}
        </FormWrapper>
      </div>
    </DocumentFormProvider>
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
};

export default DocumentForm;
