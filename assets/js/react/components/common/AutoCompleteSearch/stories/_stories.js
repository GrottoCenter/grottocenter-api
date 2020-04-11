import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import styled from 'styled-components';
import { Typography, Slider, Switch, Divider as MuiDivider } from '@material-ui/core';

import AutoCompleteSearch from '../index';
import countries from './suggestions';

const Divider = styled(MuiDivider)`
  margin-bottom: 8px;
`;
const Wrapper = styled.div`
  padding: 10px;
  width: 500px;
  background-color: ${({ theme }) => theme.palette.primary.light};
`;

function countryToFlag(isoCode) {
  return typeof String.fromCodePoint !== 'undefined'
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    : isoCode;
}

const renderOption = (option) => (
  <>
    <span>{countryToFlag(option.code)}</span>
    {option.label} ({option.code}) +{option.phone}
  </>
);

const WithState = () => {
  const [input, setInput] = React.useState('');
  const [hasError, setHasError] = React.useState(false);
  const [isDisable, setDisable] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);

  const [delay, setDelay] = React.useState(0);

  const handleDelay = (_event, newValue) => {
    setDelay(newValue);
  };
  const handleError = () => {
    setHasError(!hasError);
  };
  const handleDisable = () => {
    setDisable(!isDisable);
  };

  // imitating query
  React.useEffect(() => {
    if (input.length > 2) {
      setHasError(false);
      const newResults = countries.filter((s) =>
        s.label.toLowerCase().includes(input.toLowerCase()),
      );
      setIsLoading(true);
      setTimeout(() => {
        setSuggestions(newResults);
        setIsLoading(false);
      }, delay * 1000);
    }
  }, [input]);

  return (
    <Wrapper>
      <Typography id="delay-slider" gutterBottom>
        delay in seconds
      </Typography>
      <Slider
        min={0}
        max={10}
        value={delay}
        onChange={handleDelay}
        aria-labelledby="delay-slider"
        valueLabelDisplay="auto"
      />
      <Divider light />
      <Typography id="error-switch" gutterBottom>
        switch error
      </Typography>
      <Switch
        checked={hasError}
        onChange={handleError}
        color="primary"
        // name="checkedB"
        inputProps={{ 'aria-label': 'primary checkbox' }}
      />
      <Divider light />
      <Typography id="disable-switch" gutterBottom>
        switch disable
      </Typography>
      <Switch
        checked={isDisable}
        onChange={handleDisable}
        color="primary"
        // name="checkedB"
        inputProps={{ 'aria-label': 'primary checkbox' }}
      />
      <Divider light />
      <AutoCompleteSearch
        disabled={isDisable}
        onSelection={action('onSelection')}
        label="Quick search"
        input={input}
        inputValue={input}
        onInputChange={setInput}
        suggestions={suggestions}
        renderOption={renderOption}
        hasError={hasError}
        errorMessage="Unexpected error"
        isLoading={isLoading}
      />
    </Wrapper>
  );
};

storiesOf('AutoCompleteSearch', module).add('Default', () => <WithState />);
