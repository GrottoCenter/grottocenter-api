import React from 'react';
import { isNil, length } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import AutoCompleteSearch from '../components/common/AutoCompleteSearch';
import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../actions/Quicksearch';
import { entityOptionForSelector } from '../helpers/Entity';
import { useDebounce } from '../hooks';

// ========================

export const searchableTypes = {
  cavers: 'cavers',
  documents: 'documents',
  entries: 'entries',
  massifs: 'massifs',
  organizations: 'grottos',
};

const renderOption = (option) => entityOptionForSelector(option);
const getOptionLabel = (option) => option.name;

const QuickSearch = ({
  searchOnTypes = ['documents', 'entrances', 'grottos', 'massifs'],
  ...autoCompleteProps
}) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const dispatch = useDispatch();
  const { results, errors, isLoading } = useSelector(
    (state) => state.quicksearch,
  );
  const [input, setInput] = React.useState('');
  const debouncedInput = useDebounce(input);

  const handleSelection = (selection) => {
    if (selection.id) {
      switch (selection.type) {
        case 'entrance':
          history.push(`/ui/entries/${encodeURIComponent(selection.id)}`);
          break;
        case 'massif':
          history.push(`/ui/massifs/${encodeURIComponent(selection.id)}`);
          break;
        case 'document':
          history.push(`/ui/documents/${encodeURIComponent(selection.id)}`);
          break;
        case 'grotto':
          history.push(`/ui/organizations/${encodeURIComponent(selection.id)}`);
          break;
        case 'caver':
          history.push(`/ui/cavers/${encodeURIComponent(selection.id)}`);
          break;
        default:
      }
    }
    setInput('');
  };

  React.useEffect(() => {
    if (length(debouncedInput) > 2) {
      const criterias = {
        query: debouncedInput.trim(),
        complete: false,
      };
      if (searchOnTypes.length !== 0) criterias.resourceTypes = searchOnTypes;
      dispatch(fetchQuicksearchResult(criterias));
    } else {
      dispatch(resetQuicksearch());
    }
  }, [debouncedInput]);

  return (
    <AutoCompleteSearch
      onInputChange={setInput}
      inputValue={input}
      label={formatMessage({ id: 'Quick search' })}
      suggestions={results}
      onSelection={handleSelection}
      renderOption={renderOption}
      getOptionLabel={getOptionLabel}
      hasError={!isNil(errors)}
      isLoading={isLoading}
      {...autoCompleteProps}
    />
  );
};

export default QuickSearch;

QuickSearch.propTypes = {
  hasFixWidth: PropTypes.bool,
  label: PropTypes.string,
  searchOnTypes: PropTypes.arrayOf(PropTypes.string),
};
