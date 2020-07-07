import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
} from '@material-ui/core';

import AutoCompleteSearch from '../../../AutoCompleteSearch';

import Translate from '../../../Translate';

// ===================================
const MassifInput = styled(FilledInput)`
  ${({ theme }) => `
  color: ${theme.palette.primaryTextColor} !important;
  `}
`;

const StyledFormControl = styled(FormControl)`
  ${({ theme }) => `
  background-color: ${theme.palette.primary3Color};
  `}
`;
// ===================================

const MassifAutoComplete = ({
  massif,
  massifSuggestions,
  hasError,
  onMassifChange,
  required,
}) => {
  const [massifInputTmp, setMassifInputTmp] = React.useState('');

  const handleInputChange = (value) => {
    if (massif && massif.name === value) {
      setMassifInputTmp('');
    } else {
      setMassifInputTmp(value);
    }
  };
  const handleMassifSelection = (value) => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (value !== null) {
      onMassifChange(value);
    }
    setMassifInputTmp('');
  };

  return (
    <>
      <FormControl
        variant="filled"
        required={required}
        error={hasError}
        fullWidth
      >
        <InputLabel>
          <Translate>Massif</Translate>
        </InputLabel>
        <MassifInput
          disabled
          value={massif ? massif.name : ''}
          endAdornment={
            <InputAdornment position="end">
              <img
                src="/images/massif.svg"
                alt="Massif icon"
                style={{ width: '40px' }}
              />
            </InputAdornment>
          }
        />

        <StyledFormControl
          variant="filled"
          required={required}
          error={hasError}
        >
          <AutoCompleteSearch
            onSelection={handleMassifSelection}
            label="Search for a massif..."
            inputValue={massifInputTmp}
            onInputChange={handleInputChange}
            suggestions={massifSuggestions}
            renderOption={(option) => option.name}
            getOptionLabel={(option) => option.name}
            hasError={false} // TODO ?
            isLoading={false} // TODO
          />
        </StyledFormControl>

        <FormHelperText>
          <Translate>
            If the document is related to a massif, you can link it to it. Use
            the search bar above to find an existing massif.
          </Translate>
        </FormHelperText>
      </FormControl>
    </>
  );
};

MassifAutoComplete.propTypes = {
  massifSuggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  massif: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  hasError: PropTypes.bool.isRequired,
  onMassifChange: PropTypes.func.isRequired,
  required: PropTypes.bool.isRequired,
};

export default MassifAutoComplete;
