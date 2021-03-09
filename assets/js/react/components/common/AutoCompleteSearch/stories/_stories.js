import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import styled from 'styled-components';
import {
  Typography,
  Slider,
  Switch,
  Divider as MuiDivider,
} from '@material-ui/core';

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

const SearchWrapper = styled.div`
  margin-left: auto;
  width: ${(props) => (props.width ? props.width : 100)}%;
`;

function countryToFlag(isoCode) {
  return typeof String.fromCodePoint !== 'undefined'
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
}

const renderOption = (option) => (
  <>
    <span>{countryToFlag(option.code)}</span>
    {option.label} ({option.code}) +{option.phone}
  </>
);

const getOptionLabel = (option) => option.label;

const WithState = () => {
  const [input, setInput] = React.useState('');
  const [hasError, setHasError] = React.useState(false);
  const [isDisable, setDisable] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [width, setWidth] = React.useState(100);

  const [delay, setDelay] = React.useState(0);

  const handleWidth = (_event, newWidth) => {
    setWidth(newWidth);
  };
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
      <Typography id="width-slider" gutterBottom>
        width in % : {width}%
      </Typography>
      <Slider
        min={0}
        max={100}
        value={width}
        onChange={handleWidth}
        aria-labelledby="width-slider"
        valueLabelDisplay="auto"
      />
      <Divider light />
      <Typography id="delay-slider" gutterBottom>
        delay in seconds : {delay} second(s)
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
      <SearchWrapper width={width}>
        <AutoCompleteSearch
          disabled={isDisable}
          onSelection={action('onSelection')}
          label="Quick search"
          inputValue={input}
          onInputChange={setInput}
          suggestions={suggestions}
          renderOption={renderOption}
          getOptionLabel={getOptionLabel}
          hasError={hasError}
          errorMessage="Unexpected error"
          isLoading={isLoading}
        />
      </SearchWrapper>
    </Wrapper>
  );
};

storiesOf('AutoCompleteSearch', module).add('Default', () => <WithState />);
