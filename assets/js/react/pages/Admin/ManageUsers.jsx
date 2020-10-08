import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { postCaverGroups } from '../../actions/Caver';

import AuthChecker from '../../features/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ManageUserGroups from '../../components/appli/ManageUserGroups';

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

  const caverState = useSelector((state) => state.caver);

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
    } else {
      setAreGroupsSubmittedWithSuccess(false);
    }
  }, [
    areGroupsSubmitted,
    areGroupsSubmittedWithSuccess,
    caverState.latestHttpCode,
  ]);

  return (
    <Layout
      footer=""
      title={formatMessage({ id: 'Manage Users' })}
      content={
        <AuthChecker
          componentToDisplay={
            <ManageUserGroups
              areGroupsSubmittedWithSuccess={areGroupsSubmittedWithSuccess}
              initialUser={initialUser}
              onSaveGroups={onSaveGroups}
              onSelection={onSelection}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
            />
          }
        />
      }
    />
  );
};

export default ManageUsers;
