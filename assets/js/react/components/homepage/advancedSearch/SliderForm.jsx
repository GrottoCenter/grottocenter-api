import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControl as MuiFormControl,
  FormHelperText,
  FormLabel,
  Slider as MuiSlider,
  Switch,
} from '@material-ui/core';
import styled from 'styled-components';

const Slider = styled(MuiSlider)`
  width: 200px;
`;

export const StyledFormControl = styled(MuiFormControl)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const SliderForm = ({
  label,
  helperText,
  disabled,
  onDisable,
  min,
  max,
  value,
  onChange,
}) => {
  const marks = [
    {
      value: min,
      label: min,
    },
    {
      value: max,
      label: max,
    },
  ];

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  return (
    <StyledFormControl>
      <FormLabel>
        {label}
        <Switch checked={!disabled} onChange={onDisable} />
      </FormLabel>
      <Slider
        min={min}
        max={max}
        style={{ marginBottom: '8px' }}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        marks={marks}
        aria-labelledby={label}
        valueLabelDisplay="auto"
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </StyledFormControl>
  );
};

SliderForm.propTypes = {
  label: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  disabled: PropTypes.bool.isRequired,
  onDisable: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func.isRequired,
};

export default SliderForm;
