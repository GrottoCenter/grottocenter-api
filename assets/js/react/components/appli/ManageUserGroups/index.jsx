import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, CircularProgress, Typography } from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import { isNil, length } from 'ramda';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../../../actions/Quicksearch';

import { entityOptionForSelector } from '../../../helpers/Entity';
import { useDebounce } from '../../../hooks';

import AutoCompleteSearch from '../../common/AutoCompleteSearch';
import ErrorMessage from '../../common/StatusMessage/ErrorMessage';
import SuccessMessage from '../../common/StatusMessage/SuccessMessage';

import UserProperties from './UserProperties';
import UserGroups from './UserGroups';

// ==========

const FeedbackBlock = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)}px;
  text-align: center;
`;

const UserBlock = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const FlexBlock = styled.div`
  flex: 1;
  margin: ${({ theme }) => theme.spacing(3)}px;
`;

const SearchBarBackground = styled.div`
  background-color: ${({ theme }) => theme.palette.primary.veryLight};
`;

const SpacedTopButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
`;

// ==========

const ManageUserGroups = ({
  areGroupsSubmittedWithSuccess,
  initialUser,
  onSaveGroups,
  onSelection,
  selectedUser,
  setSelectedUser,
}) => {
  // State
  const [inputValue, setInputValue] = useState('');

  // Various hooks
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const debouncedInput = useDebounce(inputValue);
  const { results, errors, isLoading } = useSelector(
    (state) => state.quicksearch,
  );
  const caverState = useSelector((state) => state.caver);

  // Functions
  const renderOption = (option) => entityOptionForSelector(option);
  const getOptionLabel = (option) => option.name;

  const handleOnSelection = (selection) => {
    onSelection(selection);
    setInputValue('');
  };

  useEffect(() => {
    // Check search input value and launch / reset search
    if (length(debouncedInput) > 2) {
      const criterias = {
        query: debouncedInput.trim(),
        complete: true,
        resourceType: 'cavers',
      };
      dispatch(fetchQuicksearchResult(criterias));
    } else {
      dispatch(resetQuicksearch());
    }
  }, [debouncedInput, caverState.latestHttpCode]);

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {formatMessage({ id: 'Change user groups' })}
      </Typography>
      <SearchBarBackground>
        <AutoCompleteSearch
          disabled={false}
          onSelection={handleOnSelection}
          label="Search a caver"
          inputValue={inputValue}
          onInputChange={setInputValue}
          suggestions={results}
          renderOption={renderOption}
          getOptionLabel={getOptionLabel}
          errorMessage="Unexpected error"
          hasError={!isNil(errors)}
          isLoading={isLoading}
        />
      </SearchBarBackground>
      {selectedUser && (
        <>
          <SpacedTopButton
            onClick={() => setSelectedUser(null)}
            startIcon={<ClearIcon />}
          >
            {formatMessage({ id: 'Unselect user' })}
          </SpacedTopButton>
          <UserBlock>
            <FlexBlock style={{ flexBasis: '300px' }}>
              <UserProperties user={selectedUser} />
            </FlexBlock>
            <FlexBlock style={{ flexBasis: '200px' }}>
              <UserGroups
                initialUser={initialUser}
                isLoading={caverState.isLoading}
                onSaveGroups={onSaveGroups}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
              />
            </FlexBlock>
          </UserBlock>
        </>
      )}
      {(caverState.isLoading ||
        caverState.errorMessages.length > 0 ||
        areGroupsSubmittedWithSuccess) && (
        <FeedbackBlock>
          {caverState.isLoading && <CircularProgress />}

          {caverState.errorMessages.length > 0 &&
            caverState.errorMessages.map((error) => (
              <ErrorMessage
                key={error}
                message={formatMessage({ id: error })}
              />
            ))}

          {areGroupsSubmittedWithSuccess && (
            <SuccessMessage
              message={formatMessage({ id: 'Groups updated with success!' })}
            />
          )}
        </FeedbackBlock>
      )}
    </>
  );
};

ManageUserGroups.propTypes = {
  areGroupsSubmittedWithSuccess: PropTypes.bool.isRequired,
  initialUser: PropTypes.shape({
    groups: PropTypes.arrayOf(PropTypes.any),
  }),
  onSaveGroups: PropTypes.func.isRequired,
  onSelection: PropTypes.func.isRequired,
  selectedUser: PropTypes.shape({
    id: PropTypes.number,
    groups: PropTypes.arrayOf(PropTypes.any),
  }),
  setSelectedUser: PropTypes.func.isRequired,
};

export default ManageUserGroups;
