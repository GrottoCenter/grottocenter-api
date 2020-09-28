import React from 'react';
import { useIntl } from 'react-intl';

import AuthChecker from '../../components/common/AuthChecker';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import AdminList from '../../components/appli/AdminList';
import ManageUserGroups from '../../components/appli/ManageUserGroups';

// ==========

const ManageUsers = () => {
  const { formatMessage } = useIntl();

  return (
    <Layout
      footer=""
      title={formatMessage({ id: 'Manage Users' })}
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <ManageUserGroups />
              <hr />
              <AdminList />
            </>
          }
        />
      }
    />
  );
};

export default ManageUsers;
