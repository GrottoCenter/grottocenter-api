import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';
import MultipleSelectComponent from '../../../../common/Form/MultipleSelect';

const MultipleSelect = (props) => {
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
    <MultipleSelectComponent
      {...props}
      handleOnChange={handleOnChange}
      value={value}
    />
  );
};

const SelectInheritedProps = MultipleSelectComponent.propTypes; // eslint-disable-line react/forbid-foreign-prop-types
delete SelectInheritedProps.value;
delete SelectInheritedProps.handleOnChange;

MultipleSelect.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  ...SelectInheritedProps,
};

export default MultipleSelect;
