import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { List, ListItem, Typography } from '@material-ui/core';
import PeopleIcon from '@material-ui/icons/People';
import DocumentListIcon from '@material-ui/icons/PlaylistAddCheck';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import ListAltIcon from '@material-ui/icons/ListAlt';
import styled from 'styled-components';

import { usePermissions } from '../hooks';
import Layout from '../components/common/Layouts/Fixed/FixedContent';

// ==========

const StyledList = styled(List)`
  display: flex;
  flex-wrap: wrap;
`;

const StyledListItem = styled(ListItem)`
  border: 1px solid ${(props) => props.theme.palette.primary1Color};
  flex-basis: calc(20% - ${(props) => props.theme.spacing(2) * 2}px);
  flex-direction: column;
  margin: ${(props) => props.theme.spacing(2)}px;
`;

const DashboardBlock = styled.div`
  margin-bottom: ${(props) => props.theme.spacing(4)}px;
`;

// ==========

//
//
// M A I N - C O M P O N E N T
//
//

const Dashboard = () => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const permissions = usePermissions();

  const handleOnListItemClick = (url) => {
    history.push(url);
  };

  useEffect(() => {
    if (!permissions.isAuth) {
      history.push('');
    }
  }, [permissions]);

  return (
    <Layout
      footer=""
      title={formatMessage({ id: 'Dashboard' })}
      content={
        <>
          {permissions.isAdmin && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'Administrator Dashboard' })}
              </Typography>
              <StyledList cols={3}>
                <StyledListItem
                  button
                  key="manage-users-admin-tile-key"
                  onClick={() => handleOnListItemClick('/ui/admin/users')}
                >
                  <PeopleIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'Manage users' })}
                  </Typography>
                </StyledListItem>
              </StyledList>
            </DashboardBlock>
          )}
          {permissions.isModerator && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'Moderator Dashboard' })}
              </Typography>
              <StyledList cols={3}>
                <StyledListItem
                  button
                  key="document-validation-admin-tile-key"
                  onClick={() =>
                    handleOnListItemClick('/ui/documents/validation')
                  }
                >
                  <DocumentListIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'Document validation' })}
                  </Typography>
                </StyledListItem>
              </StyledList>
            </DashboardBlock>
          )}
          {permissions.isUser && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'User Dashboard' })}
              </Typography>
              <StyledList cols={6}>
                <StyledListItem
                  button
                  key="my-contributions-user-tile-key"
                  onClick={() => handleOnListItemClick('/ui/contributions')}
                >
                  <ListAltIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'My contributions' })}
                  </Typography>
                </StyledListItem>
                <StyledListItem
                  button
                  key="import-csv-user-tile-key"
                  onClick={() => handleOnListItemClick('/ui/import-csv')}
                >
                  <ImportExportIcon fontSize="large" color="primary" />
                  <Typography variant="h4" align="center">
                    {formatMessage({ id: 'Import CSV' })}
                  </Typography>
                </StyledListItem>
              </StyledList>
            </DashboardBlock>
          )}
        </>
      }
    />
  );
};

export default Dashboard;
