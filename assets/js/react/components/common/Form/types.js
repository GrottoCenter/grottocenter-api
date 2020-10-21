import PropTypes from 'prop-types';

// eslint-disable-next-line import/prefer-default-export
export const FormAutoCompleteTypes = {
  autoCompleteSearch: PropTypes.node,
  getValueName: PropTypes.func.isRequired,
  hasError: PropTypes.bool.isRequired,
  helperContent: PropTypes.node,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool.isRequired,
  resultEndAdornment: PropTypes.node,
  value: PropTypes.shape({}),
};

// eslint-disable-next-line import/prefer-default-export
export const MultipleSelectTypes = {
  computeHasError: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  getOptionSelected: PropTypes.func.isRequired,
  handleOnChange: PropTypes.func.isRequired, // handleOnChange(event: object, value: T | T[], reason: string)
  helperText: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  labelName: PropTypes.string.isRequired,
  loadSearchResults: PropTypes.func.isRequired, // should load new search results according to the search string entered by the user
  nbCharactersNeededToLaunchSearch: PropTypes.number,
  noOptionsText: PropTypes.node,
  renderOption: PropTypes.func,
  required: PropTypes.bool,
  resetSearchResults: PropTypes.func.isRequired, // should reset all the search results
  searchError: PropTypes.string,
  searchResults: PropTypes.arrayOf(PropTypes.any).isRequired,
  value: PropTypes.arrayOf(PropTypes.any).isRequired,
};

// eslint-disable-next-line import/prefer-default-export
export const MultipleSelectWithOptionsTypes = {
  computeHasError: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  getOptionSelected: PropTypes.func.isRequired,
  handleOnChange: PropTypes.func.isRequired, // handleOnChange(event: object, value: T | T[], reason: string)
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  noOptionsText: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.any),
  renderOption: PropTypes.func,
  required: PropTypes.bool,
  value: PropTypes.arrayOf(PropTypes.any).isRequired,
};
