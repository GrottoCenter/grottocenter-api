import React from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { InputBase } from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Translate from '../Translate';
import DisabledTooltip from '../DisabledTooltip';

const getOptionLabel = (option) => option.label;

const StyledAutocomplete = styled(Autocomplete)`
  min-width: 200px;
`;

const InputWrapper = styled.div`
  display: flex;
  margin-left: auto;
  width: ${({ hasFixWidth }) => (hasFixWidth ? 100 : 80)}%;
  border-radius: ${({ theme }) => theme.shape.borderRadius};
  background-color: ${({ theme }) => fade(theme.palette.common.white, 0.15)};
  transition: 0.5s;
  &:hover {
    background-color: ${({ theme, disabled }) =>
      fade(theme.palette.common.white, disabled ? 0.15 : 0.25)};
  }
  &:focus-within {
    width: 100%;
  }
`;

const SearchIconWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing(1)}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledInputBase = styled(InputBase)`
  padding: ${({ theme }) => theme.spacing(1, 1, 1, 0)};
  width: 100%;
`;

const AutoCompleteSearch = ({
  suggestions,
  renderOption,
  onSelection,
  onInputChange,
  label = 'Search...',
  hasError = false,
  isLoading = false,
  disabled = false,
  hasFixWidth = true,
}) => {
  const [value, setValue] = React.useState('');
  const [isOpen, setOpen] = React.useState(false);

  const handleOnSelectionChange = (_event, newSelection) => {
    onSelection(newSelection);
  };
  const handleOnInputChange = (_event, newInput) => {
    setValue(newInput);
    onInputChange(newInput);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => {
    if (value !== '') {
      setOpen(true);
    }
  };

  React.useEffect(() => {
    if (value === '') {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [value]);

  return (
    <StyledAutocomplete
      disabled={disabled}
      id="AutoCompleteSearch"
      // disableClearable
      // value={input}
      // inputValue={inputValue}
      inputValue={value}
      onInputChange={handleOnInputChange}
      onChange={handleOnSelectionChange}
      options={suggestions}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      loading={isLoading}
      color="inherit"
      onOpen={handleOpen}
      onClose={handleClose}
      open={isOpen}
      noOptionsText={<Translate>No result (enter at least 3 characters)</Translate>}
      renderInput={(params) => (
        <DisabledTooltip disabled={disabled}>
          <InputWrapper hasFixWidth={hasFixWidth} disabled={disabled}>
            <SearchIconWrapper>
              <SearchIcon color={disabled ? 'disabled' : 'inherit'} />
            </SearchIconWrapper>
            <StyledInputBase
              ref={params.InputProps.ref}
              // autoFocus
              placeholder={label}
              error={hasError}
              inputProps={{
                ...params.inputProps,
              }}
              fullWidth
            />
          </InputWrapper>
        </DisabledTooltip>
      )}
    />
  );
};

AutoCompleteSearch.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.node).isRequired,
  onSelection: PropTypes.func.isRequired,
  // input: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  renderOption: PropTypes.func.isRequired,
  label: PropTypes.string,
  hasError: PropTypes.bool,
  // errorMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  hasFixWidth: PropTypes.bool,
};

export default AutoCompleteSearch;
