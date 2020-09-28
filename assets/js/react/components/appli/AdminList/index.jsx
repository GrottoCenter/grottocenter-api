import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Typography,
} from '@material-ui/core';

import { getAdmins } from '../../../actions/Caver';

// ==========

const AdminList = () => {
  const { formatMessage } = useIntl();
  const { admins, isLoading } = useSelector((state) => state.caver);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAdmins());
  }, []);

  return isLoading ? (
    <CircularProgress />
  ) : (
    <>
      <Typography variant="h2" gutterBottom>
        {formatMessage({ id: 'Administrators' })}
      </Typography>
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
          {admins.map((row) => (
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
    </>
  );
};

AdminList.propTypes = {};
export default AdminList;
