import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Typography,
} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';

// ==========

const UserList = ({ isLoading, title, userList }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {title}
      </Typography>
      {isLoading ? (
        <Skeleton variant="rect" width="100%" height={150} />
      ) : (
        <Table size="small" aria-label="admins dense table">
          <TableHead>
            <TableRow>
              <TableCell>{formatMessage({ id: 'Id' })}</TableCell>
              <TableCell>
                {formatMessage({ id: 'Caver.Name', defaultMessage: 'Name' })}
              </TableCell>
              <TableCell>{formatMessage({ id: 'Surname' })}</TableCell>
              <TableCell>{formatMessage({ id: 'Nickname' })}</TableCell>
              <TableCell>{formatMessage({ id: 'Mail' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userList.map((row) => (
              <TableRow key={row.id}>
                <TableCell component="th" scope="row">
                  {row.id}
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.surname}</TableCell>
                <TableCell>{row.nickname}</TableCell>
                <TableCell>{row.mail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

UserList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  userList: PropTypes.arrayOf(PropTypes.any).isRequired,
};
export default UserList;
