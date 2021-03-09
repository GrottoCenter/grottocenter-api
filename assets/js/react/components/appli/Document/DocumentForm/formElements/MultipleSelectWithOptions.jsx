import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';
import MultipleSelectComponentWithOptions from '../../../../common/Form/MultipleSelectWithOptions';
import { MultipleSelectWithOptionsTypes } from '../../../../common/Form/types';

// ======================

const MultipleSelectWithOptions = (props) => {
  const { contextValueName } = props;
  const {
    docAttributes: { [contextValueName]: value },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        updateAttribute(contextValueName, []);
        break;
      case 'select-option':
      case 'remove-option':
        updateAttribute(contextValueName, newValue);
        break;
      default:
    }
  };

  return (
    <MultipleSelectComponentWithOptions
      {...props}
      handleOnChange={handleOnChange}
      value={value}
    />
  );
};

const SelectInheritedProps = MultipleSelectWithOptionsTypes;
delete SelectInheritedProps.value;
delete SelectInheritedProps.handleOnChange;

MultipleSelectWithOptions.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  ...SelectInheritedProps,
};

export default MultipleSelectWithOptions;
