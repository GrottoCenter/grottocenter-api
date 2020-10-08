import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

// ==========

const UserPropertyName = styled(Typography)`
  display: inline-block;
  margin-right: ${({ theme }) => theme.spacing(4)}px;
  width: 120px;
`;

// ==========

const UserProperty = ({ propertyName, value }) => (
  <div>
    <UserPropertyName
      variant="body1"
      color="primary"
      display="inline"
      align="right"
    >
      <b>{propertyName}</b>
    </UserPropertyName>
    <Typography variant="body1" display="inline">
      {value || <i>{value}</i>}
    </Typography>
  </div>
);

UserProperty.propTypes = {
  propertyName: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// ==========

const UserProperties = ({ user }) => {
  const { formatMessage } = useIntl();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'User information' })}
      </Typography>
      <UserProperty
        propertyName={formatMessage({ id: 'Id' })}
        value={user.id}
      />
      <UserProperty
        propertyName={formatMessage({
          id: 'Caver.Name',
          defaultMessage: 'Name',
        })}
        value={user.name}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Surname' })}
        value={user.surname ? user.surname.toUpperCase() : user.surname}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Nickname' })}
        value={user.nickname}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Mail' })}
        value={user.mail}
      />
    </div>
  );
};

UserProperties.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    mail: PropTypes.string,
    name: PropTypes.string,
    nickname: PropTypes.string,
    surname: PropTypes.string,
  }).isRequired,
};

export default UserProperties;
