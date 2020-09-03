import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

import { DocumentFormContext } from '../Provider';

import FormAutoCompleteComponent from '../../../../common/Form/FormAutoComplete';
// ===================================

const FormAutoComplete = (props) => {
  const {
    contextValueName,
    helperContent,
    helperContentIfValueIsForced,
  } = props;
  const {
    docAttributes: { [contextValueName]: value, partOf },
  } = useContext(DocumentFormContext);

  const isValueForced = pathOr(null, [contextValueName], partOf) !== null;

  return (
    <FormAutoCompleteComponent
      {...props}
      value={value}
      helperContent={
        isValueForced ? helperContentIfValueIsForced : helperContent
      }
      isValueForced={isValueForced}
    />
  );
};

const FormAutoCompleteInheritedProps = FormAutoCompleteComponent.propTypes; // eslint-disable-line react/forbid-foreign-prop-types
delete FormAutoCompleteInheritedProps.value;
delete FormAutoCompleteInheritedProps.isValueForced;

FormAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  ...FormAutoCompleteInheritedProps,
};

export default FormAutoComplete;
