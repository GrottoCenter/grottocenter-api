import React from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  InputBase,
  CircularProgress,
  InputAdornment,
  Popper,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import ErrorIcon from '@material-ui/icons/Error';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Translate from '../Translate';
import DisabledTooltip from '../DisabledTooltip';

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

const ResultsPopper = styled(Popper)`
  width: fit-content;
  > div {
    width: fit-content;
    min-width: 100%;
    max-width: 50vw;
    ${({ hasFixWidth }) => !hasFixWidth && 'float: right'};
  }
`;

// eslint-disable-next-line react/prop-types
const InputAdornments = ({ isLoading, hasError }) =>
  isLoading || hasError ? (
    <InputAdornment>
      {isLoading && <CircularProgress color="secondary" size={24} />}
      {hasError && <ErrorIcon color="secondary" />}
    </InputAdornment>
  ) : null;

const StyledPopper = (hasFixWidth) => (props) => (
  <ResultsPopper {...props} hasFixWidth={hasFixWidth} placement="bottom-end" />
);
const AutoCompleteSearch = ({
  suggestions,
  renderOption,
  getOptionLabel,
  onSelection,
  inputValue,
  onInputChange,
  label = 'Search...',
  hasError = false,
  isLoading = false,
  disabled = false,
  hasFixWidth = true,
}) => {
  const [isOpen, setOpen] = React.useState(false);

  const handleSelectionChange = (_event, newSelection) => {
    onSelection(newSelection);
  };

  const handleInputChange = (e, newInput) => {
    if (e === null || e.type === null || e.type === 'blur') {
      onInputChange('');
    } else {
      onInputChange(newInput);
    }
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => {
    if (inputValue !== '') {
      setOpen(true);
    }
  };

  React.useEffect(() => {
    if (inputValue === '') {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [inputValue]);

  return (
    <StyledAutocomplete
      disabled={disabled}
      id={`AutoCompleteSearch${hasFixWidth}`}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleSelectionChange}
      options={suggestions}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      loading={isLoading}
      PopperComponent={StyledPopper(hasFixWidth)}
      color="inherit"
      // had to disable built-int filter
      // https://github.com/mui-org/material-ui/issues/20068
      filterOptions={(x) => x}
      onOpen={handleOpen}
      onClose={handleClose}
      open={isOpen}
      noOptionsText={
        <Translate>No result (enter at least 3 characters)</Translate>
      }
      renderInput={(params) => (
        <DisabledTooltip disabled={disabled}>
          <InputWrapper hasFixWidth={hasFixWidth} disabled={disabled}>
            <SearchIconWrapper>
              <SearchIcon color={disabled ? 'disabled' : 'inherit'} />
            </SearchIconWrapper>
            <StyledInputBase
              disabled={params.disabled}
              ref={params.InputProps.ref}
              // Todo: add translation
              placeholder={label}
              error={hasError}
              inputProps={{
                ...params.inputProps,
              }}
              endAdornment={
                <InputAdornments isLoading={isLoading} hasError={hasError} />
              }
              fullWidth
            />
          </InputWrapper>
        </DisabledTooltip>
      )}
    />
  );
};

AutoCompleteSearch.propTypes = {
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

export default AutoCompleteSearch;
