import PropTypes from 'prop-types';

const defaultFormSteps = [
  { id: 1, name: 'General Information', isValid: false },
  { id: 2, name: 'File Completion', isValid: false },
  { id: 3, name: 'Review', isValid: false },
  { id: 4, name: 'Confirm or Rollback', isValid: true },
];

// eslint-disable-next-line import/prefer-default-export
export const ImportFormTypes = {
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export const defaultValuesTypes = PropTypes.shape({
  selectedType: PropTypes.number,
  baseErrors: PropTypes.shape({}),
  fileImported: PropTypes.bool,
  formSteps: defaultFormSteps,
});
