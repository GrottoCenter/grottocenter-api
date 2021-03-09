import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { getAdmins, getModerators, postCaverGroups } from '../../actions/Caver';

import AuthChecker from '../../features/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ManageUserGroups from '../../components/appli/ManageUserGroups';

import UserList from './UserList';

// ==========

const MarginBottomBlock = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

// ==========

const ManageUsers = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  // State
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialUser, setInitialUser] = useState(null);

  // Redux store
  const { admins, isLoading, moderators } = useSelector((state) => state.caver);
  const {
    isLoading: isCaverGroupsLoading,
    latestHttpCode: caverUserGroupsLatestHttpCode,
  } = useSelector((state) => state.caverGroups);

  const onSaveGroups = () => {
    dispatch(postCaverGroups(selectedUser.id, selectedUser.groups));
  };

  const onSelection = (selection) => {
    if (selection !== null) {
      setSelectedUser(selection);
      setInitialUser(selection);
    }
  };

  useEffect(() => {
    // Check if submission is ok
    if (caverUserGroupsLatestHttpCode === 200 && !isCaverGroupsLoading) {
      setInitialUser(selectedUser);
      dispatch(getAdmins());
      dispatch(getModerators());
    }
  }, [isCaverGroupsLoading, caverUserGroupsLatestHttpCode]);

  useEffect(() => {
    dispatch(getAdmins());
    dispatch(getModerators());
  }, []);

  return (
    <Layout
      footer=""
      title={formatMessage({ id: 'Manage Users' })}
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <ManageUserGroups
                areGroupsSubmittedWithSuccess={
                  caverUserGroupsLatestHttpCode === 200 && !isCaverGroupsLoading
                }
                initialUser={initialUser}
                onSaveGroups={onSaveGroups}
                onSelection={onSelection}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
              />

              <hr />

              <MarginBottomBlock>
                <UserList
                  isLoading={isLoading}
                  userList={admins}
                  title={formatMessage({ id: 'List of administrators' })}
                />
              </MarginBottomBlock>

              <UserList
                isLoading={isLoading}
                userList={moderators}
                title={formatMessage({ id: 'List of moderators' })}
              />
            </>
          }
        />
      }
    />
  );
};

export default ManageUsers;
