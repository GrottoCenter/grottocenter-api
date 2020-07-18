import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, FormControl } from '@material-ui/core';
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

// ===================================

const FormBody = ({
  allAuthors,
  allIdentifierTypes,
  allLanguages,
  allLibraries,
  allMassifs,
  allPartOf,
  allRegions,
  allSubjects,
  currentFormStepId,
  handleStepBack,
  handleStepNext,
  isNextStepButtonDisabled,
  onStepIsValidChange,
}) => {
  return (
    <>
      {currentFormStepId === 1 && (
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

      {currentFormStepId === 2 && (
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
      {currentFormStepId === 3 && (
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
            disabled={isNextStepButtonDisabled}
            onClick={handleStepNext}
            style={{ float: 'right' }}
          />
        </ChangeStepWrapper>
      )}
    </>
  );
};

FormBody.propTypes = {
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

  currentFormStepId: PropTypes.number.isRequired,
  handleStepBack: PropTypes.func.isRequired,
  handleStepNext: PropTypes.func.isRequired,
  isNextStepButtonDisabled: PropTypes.bool.isRequired,
  onStepIsValidChange: PropTypes.func.isRequired,
};

export default FormBody;
