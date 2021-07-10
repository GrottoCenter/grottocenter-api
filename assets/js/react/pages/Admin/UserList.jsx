import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import Table from '../../components/common/Table';
import {
  createColumns,
  createDefaultHiddenColumns,
} from '../../components/common/Table/TableHead';

import makeCustomCellRenders from './customCellRenders';

// ==========
const defaultHiddenColumns = ['groups'];

// =====

/**
 * In this component, the custom GC Table is used without multiple pages
 * and it's offline.
 * It assumes that all users are already loaded and they will not be updated.
 */
const UserList = ({ isLoading, title, userList }) => {
  const { formatMessage } = useIntl();

  const makeTranslation = (id) => {
    if (id === 'name') return formatMessage({ id: 'Caver.Name' });
    return formatMessage({ id: `${id[0].toUpperCase()}${id.slice(1)}` });
  };
  const [columns, setColumns] = useState(
    createColumns(userList, makeTranslation),
  );
  const [hiddenColumns, setHiddenColumns] = useState(defaultHiddenColumns);
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('id');

  useEffect(() => {
    setColumns(createColumns(userList, makeTranslation));
  }, [userList]);

  useEffect(() => {
    setHiddenColumns(createDefaultHiddenColumns(columns, defaultHiddenColumns));
  }, [columns]);

  const userListOrdered = userList.sort((u1, u2) => {
    if (order === 'asc') {
      return u1[orderBy] > u2[orderBy];
    }
    return u1[orderBy] < u2[orderBy];
  });

  return (
    <Table
      columns={columns}
      customCellRenders={makeCustomCellRenders()}
      data={userListOrdered || []}
      hiddenColumns={hiddenColumns}
      loading={isLoading}
      order={order}
      orderBy={orderBy}
      rowsCount={userListOrdered.length}
      rowsPerPage={userListOrdered.length}
      title={title}
      updateHiddenColumns={setHiddenColumns}
      updateOrder={setOrder}
      updateOrderBy={setOrderBy}
    />
  );
};

UserList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  userList: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};
export default UserList;
