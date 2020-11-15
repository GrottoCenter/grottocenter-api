import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { List, ListItem, Typography } from '@material-ui/core';
import PeopleIcon from '@material-ui/icons/People';
import DocumentListIcon from '@material-ui/icons/PlaylistAddCheck';
import styled from 'styled-components';

import { isAuth, isAdmin, isModerator } from '../helpers/AuthHelper';
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
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserModerator, setIsUserModerator] = useState(false);
  const [isUserAuth, setIsUserAuth] = useState(false);

  const authState = useSelector((state) => state.auth);

  const handleOnListItemClick = (url) => {
    history.push(url);
  };

  useEffect(() => {
    if (!isAuth()) {
      history.push('');
    }
    setIsUserAdmin(isAdmin());
    setIsUserModerator(isModerator());
    setIsUserAuth(isAuth());
  }, [isUserAdmin, isUserModerator, isUserAuth, authState]);

  return (
    <Layout
      footer=""
      title={formatMessage({ id: 'Dashboard' })}
      content={
        <>
          {isUserAdmin && (
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
          {isUserModerator && (
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
          {isUserAuth && (
            <DashboardBlock>
              <Typography variant="h2">
                {formatMessage({ id: 'User Dashboard' })}
              </Typography>
              <Typography variant="body1">
                <i>{formatMessage({ id: 'Section under development' })}</i>
              </Typography>
            </DashboardBlock>
          )}
        </>
      }
    />
  );
};

export default Dashboard;
