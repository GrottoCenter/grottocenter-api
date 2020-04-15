import React from 'react';
import MuiToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import PropTypes from 'prop-types';
import { FormLabel } from '@material-ui/core';
import styled from 'styled-components';

import { StyledFormControl } from './SliderForm';
import Translate from '../../common/Translate';

const ToggleButtonGroup = styled(MuiToggleButtonGroup)`
  padding: ${({ theme }) => theme.spacing(2)}px;
`;

const DivingTypesForm = ({ onChange, value }) => {
  const handleCavity = (_event, newSelection) => {
    onChange(newSelection);
  };

  return (
    <StyledFormControl>
      <FormLabel>
        <Translate>Diving cave</Translate>
      </FormLabel>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleCavity}
      >
        <ToggleButton value="yes" aria-label="left aligned">
          <Translate>yes</Translate>
        </ToggleButton>
        <ToggleButton value="no" aria-label="centered">
          <Translate>no</Translate>
        </ToggleButton>
        <ToggleButton value="" aria-label="right aligned">
          <Translate>all</Translate>
        </ToggleButton>
      </ToggleButtonGroup>
    </StyledFormControl>
  );
};

DivingTypesForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default DivingTypesForm;
