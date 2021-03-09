import PropTypes from 'prop-types';

// eslint-disable-next-line import/prefer-default-export
export const AutoCompleteSearchTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelection: PropTypes.func.isRequired,
  inputValue: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  renderOption: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  label: PropTypes.string,
  hasError: PropTypes.bool,
  // errorMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  hasFixWidth: PropTypes.bool,
};
