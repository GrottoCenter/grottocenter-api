import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import { isNil, length } from 'ramda';

import {
  fetchQuicksearchResult,
  resetQuicksearch,
} from '../../../actions/Quicksearch';
import { postCaverGroups } from '../../../actions/Caver';

import { entityOptionForSelector } from '../../../helpers/Entity';
import GROUPS from '../../../helpers/GroupHelper';
import { useDebounce } from '../../../hooks';

import AutoCompleteSearch from '../../common/AutoCompleteSearch';
import ErrorMessage from '../../common/StatusMessage/ErrorMessage';
import SuccessMessage from '../../common/StatusMessage/SuccessMessage';
import Translate from '../../common/Translate';

import UserProperties from './UserProperties';

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

const SpacedButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)}px;
`;

const SpacedTopButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
`;

// ==========

const ManageUserGroups = () => {
  // State
  const [inputValue, setInputValue] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialUser, setInitialUser] = useState(null);
  const [
    areGroupsSubmittedWithSuccess,
    setAreGroupsSubmittedWithSuccess,
  ] = useState(false);
  const [areGroupsSubmitted, setAreGroupsSubmitted] = useState(false);

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

  const userGroupsHaveChanged =
    // Check if groups are different between selectedUser and initialUser
    selectedUser !== null && initialUser !== null
      ? selectedUser.groups.reduce(
          (groupsHaveChanged, g) =>
            groupsHaveChanged ||
            !initialUser.groups.some(
              (initialGroup) => g.id === initialGroup.id,
            ),
          false,
        ) || selectedUser.groups.length !== initialUser.groups.length
      : false;

  const handleOnSelection = (selection) => {
    if (selection !== null) {
      setSelectedUser(selection);
      setInitialUser(selection);
      setAreGroupsSubmitted(false);
      setAreGroupsSubmittedWithSuccess(false);
    }
    setInputValue('');
  };

  const onSaveGroups = () => {
    dispatch(postCaverGroups(selectedUser.id, selectedUser.groups));
    setAreGroupsSubmitted(true);
  };

  const handleGroupChange = (userId, groupId, value) => {
    const newGroups = selectedUser.groups.filter((g) => g.id !== groupId);
    if (value === true) {
      newGroups.push({ id: groupId });
    }
    setSelectedUser({ ...selectedUser, groups: newGroups });
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

    // Check submission
    if (caverState.latestHttpCode === 200 && areGroupsSubmitted) {
      setAreGroupsSubmittedWithSuccess(true);
      setInitialUser(selectedUser);
    } else {
      setAreGroupsSubmittedWithSuccess(false);
    }
  }, [
    debouncedInput,
    areGroupsSubmitted,
    areGroupsSubmittedWithSuccess,
    caverState.latestHttpCode,
  ]);

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
              <Typography variant="h3" gutterBottom>
                {formatMessage({ id: 'Groups' })}
              </Typography>
              {GROUPS.filter((g) => g.canBeChanged).map((possibleGroup) => (
                <FormControlLabel
                  key={possibleGroup.id}
                  control={
                    <Switch
                      checked={selectedUser.groups.some(
                        (g) => g.id === possibleGroup.id,
                      )}
                      onChange={(event) =>
                        handleGroupChange(
                          selectedUser.id,
                          possibleGroup.id,
                          event.target.checked,
                        )
                      }
                      name={possibleGroup.name}
                      color="secondary"
                    />
                  }
                  label={formatMessage({ id: possibleGroup.name })}
                  style={{ display: 'block' }}
                />
              ))}
              {userGroupsHaveChanged && !caverState.isLoading && (
                <>
                  <SpacedButton onClick={() => setSelectedUser(initialUser)}>
                    {formatMessage({ id: 'Reset' })}
                  </SpacedButton>

                  <SpacedButton onClick={onSaveGroups} color="primary">
                    {formatMessage({ id: 'Save' })}
                  </SpacedButton>
                </>
              )}
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
            errors.map((error) => (
              <ErrorMessage>
                <Translate>{error}</Translate>
              </ErrorMessage>
            ))}

          {areGroupsSubmittedWithSuccess && (
            <SuccessMessage>
              <Translate>Groups updated with success!</Translate>
            </SuccessMessage>
          )}
        </FeedbackBlock>
      )}
    </>
  );
};

export default ManageUserGroups;
