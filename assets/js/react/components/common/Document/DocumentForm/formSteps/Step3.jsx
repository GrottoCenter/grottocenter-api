import React from 'react';
import PropTypes from 'prop-types';

import IsFromBBSSwitch from '../formElements/IsFromBBSSwitch';
import PublicationDatePicker from '../formElements/PublicationDatePicker';
import StringInput from '../formElements/StringInput';

// ===================================

const Step3 = ({
  // Doc attributes
  isFromBbs,
  issue,
  publicationDate,

  // onChange functions
  onIsFromBbsChange,
  onIssueChange,
  onPublicationDateChange,

  onStepIsValidChange,
  stepId,
}) => {
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    const newIsValid = true; // Always true because of facultative attributes
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
      onStepIsValidChange(stepId, newIsValid);
    }
  });
  return (
    <>
      <StringInput
        helperText="Some helper text for Issue"
        onValueChange={onIssueChange}
        value={issue}
        valueName="Issue"
      />

      <PublicationDatePicker
        publicationDate={publicationDate}
        onPublicationDateChange={onPublicationDateChange}
      />

      <IsFromBBSSwitch
        isFromBbs={isFromBbs}
        onIsFromBbsChange={onIsFromBbsChange}
      />
    </>
  );
};

Step3.propTypes = {
  // Document attributes
  isFromBbs: PropTypes.bool.isRequired,
  issue: PropTypes.string.isRequired,
  publicationDate: PropTypes.instanceOf(Date),

  // On change functions
  onIsFromBbsChange: PropTypes.func.isRequired,
  onIssueChange: PropTypes.func.isRequired,
  onPublicationDateChange: PropTypes.func.isRequired,

  onStepIsValidChange: PropTypes.func.isRequired,
  stepId: PropTypes.number.isRequired,
};

export default Step3;
