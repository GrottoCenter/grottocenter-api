import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from '@material-ui/core';

import GROUPS from '../../../helpers/GroupHelper';

// ==========

const SpacedButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)}px;
`;

// ==========

const UserGroups = ({
  initialUser,
  isLoading,
  onSaveGroups,
  selectedUser,
  setSelectedUser,
}) => {
  const { formatMessage } = useIntl();

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

  const handleGroupChange = (userId, groupId, isChecked) => {
    const newGroups = selectedUser.groups.filter((g) => g.id !== groupId);
    if (isChecked === true) {
      newGroups.push({ id: groupId });
    }
    setSelectedUser({ ...selectedUser, groups: newGroups });
  };

  return (
    <>
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

      <SpacedButton
        onClick={() => setSelectedUser(initialUser)}
        disabled={!userGroupsHaveChanged || isLoading}
      >
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>

      <SpacedButton
        onClick={onSaveGroups}
        color="primary"
        disabled={!userGroupsHaveChanged || isLoading}
      >
        {formatMessage({ id: 'Save' })}
      </SpacedButton>
    </>
  );
};

UserGroups.propTypes = {
  initialUser: PropTypes.shape({
    groups: PropTypes.arrayOf(PropTypes.any),
  }),
  isLoading: PropTypes.bool.isRequired,
  onSaveGroups: PropTypes.func.isRequired,
  selectedUser: PropTypes.shape({
    id: PropTypes.number,
    groups: PropTypes.arrayOf(PropTypes.any),
  }),
  setSelectedUser: PropTypes.func.isRequired,
};

export default UserGroups;
