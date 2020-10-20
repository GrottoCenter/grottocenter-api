import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { getAdmins, getModerators, postCaverGroups } from '../../actions/Caver';

import AuthChecker from '../../features/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ManageUserGroups from '../../components/appli/ManageUserGroups';

import UserList from '../../components/common/UserList';

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
  const [
    areGroupsSubmittedWithSuccess,
    setAreGroupsSubmittedWithSuccess,
  ] = useState(false);
  const [areGroupsSubmitted, setAreGroupsSubmitted] = useState(false);

  // Redux store
  const caverState = useSelector((state) => state.caver);
  const { admins, isLoading, moderators } = useSelector((state) => state.caver);

  const onSaveGroups = () => {
    dispatch(postCaverGroups(selectedUser.id, selectedUser.groups));
    setAreGroupsSubmitted(true);
  };

  const onSelection = (selection) => {
    if (selection !== null) {
      setSelectedUser(selection);
      setInitialUser(selection);
      setAreGroupsSubmitted(false);
      setAreGroupsSubmittedWithSuccess(false);
    }
  };

  useEffect(() => {
    // Check if submission is ok
    if (caverState.latestHttpCode === 200 && areGroupsSubmitted) {
      setAreGroupsSubmittedWithSuccess(true);
      setInitialUser(selectedUser);
      dispatch(getAdmins());
      dispatch(getModerators());
    } else {
      setAreGroupsSubmittedWithSuccess(false);
    }
  }, [
    areGroupsSubmitted,
    areGroupsSubmittedWithSuccess,
    caverState.latestHttpCode,
  ]);

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
                areGroupsSubmittedWithSuccess={areGroupsSubmittedWithSuccess}
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
                  title={formatMessage({ id: 'Administrators' })}
                />
              </MarginBottomBlock>

              <UserList
                isLoading={isLoading}
                userList={moderators}
                title={formatMessage({ id: 'Moderators' })}
              />
            </>
          }
        />
      }
    />
  );
};

export default ManageUsers;
