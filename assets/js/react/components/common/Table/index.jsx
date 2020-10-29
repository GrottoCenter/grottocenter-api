import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  __,
  append,
  defaultTo,
  find,
  includes,
  isNil,
  pipe,
  prepend,
  prop,
  propEq,
  reject,
  unless,
  without,
  isEmpty,
} from 'ramda';
import {
  Toolbar as MuiToolbar,
  TableContainer as MuiTableContainer,
  Table as MuiTable,
  TableBody as MuiTableBody,
  Paper,
  Typography,
  LinearProgress,
  TablePagination,
  Divider,
} from '@material-ui/core';
import { useIntl } from 'react-intl';

import TableHead from './TableHead';
import { ActionColumnIds } from './CustomHeaderCell';
import VisibleColumnsMenu from './VisibleColumnsMenu';
import Row from './CustomRow';
import InitialTable from './InitialTable';

const Wrapper = styled(Paper)`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TableContainer = styled(MuiTableContainer)`
  max-height: calc(70vh - ${({ theme }) => theme.appBarHeight}px);
`;

const TableBody = styled(MuiTableBody)`
  filter: ${({ $loading }) => $loading && 'blur(6px)'};
  pointer-events: ${({ $loading }) => $loading && 'none'};
`;

const Toolbar = styled(MuiToolbar)`
  flex-direction: row;
  justify-content: space-between;
`;

const TableFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  min-height: 40px;
  align-items: center;
`;

const SelectedTypography = styled(Typography)`
  padding-left: ${({ theme }) => theme.spacing(4)}px;
`;

const Table = ({
  title,
  updateSelection,
  selection = [],
  data,
  orderBy,
  updateOrderBy,
  order,
  updateOrder,
  columns,
  hiddenColumns,
  updateHiddenColumns,
  openDetailedView,
  currentPage = 0,
  updateCurrentPage,
  rowsPerPage = 50,
  updateRowsPerPage,
  rowsCount,
  loading,
  customHeaderCellRenders,
  customCellRenders,
}) => {
  const { formatMessage } = useIntl();
  const isSelected = includes(__, selection);
  const isHiddenColumn = pipe(prop('id'), includes(__, hiddenColumns));
  const [isFirstLoad, setIsFirstLoad] = useState(isEmpty(data) && loading);

  useEffect(() => {
    setIsFirstLoad(isEmpty(data) && loading);
  }, [data, loading]);

  const getVisibleColumns = pipe(
    reject(isHiddenColumn),
    unless(
      // eslint-disable-next-line no-unused-vars
      (_) => isNil(openDetailedView),
      prepend({ id: ActionColumnIds.detailedView }),
    ),
    unless(
      // eslint-disable-next-line no-unused-vars
      (_) => isNil(updateSelection),
      prepend({ id: ActionColumnIds.selection }),
    ),
  );
  const getCustomCellRenders = useCallback(
    (id) =>
      pipe(
        defaultTo([]),
        find(propEq('id', id)),
        prop('customRender'),
        defaultTo(undefined),
      )(customCellRenders),
    [customCellRenders],
  );

  const getCustomHeaderCellRenders = useCallback(
    (id) =>
      pipe(
        defaultTo([]),
        find(propEq('id', id)),
        prop('customRender'),
        defaultTo(undefined),
      )(customHeaderCellRenders),
    [customHeaderCellRenders],
  );

  // eslint-disable-next-line no-unused-vars
  const handleSelection = (newSelection) => (e) => {
    const uncheck = without([newSelection]);
    const check = append(newSelection);
    if (!isNil(updateSelection)) {
      updateSelection(
        isSelected(newSelection) ? uncheck(selection) : check(selection),
      );
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSort = (property) => (event) => {
    const isAsc = orderBy === property && order === 'asc';
    if (!isNil(updateOrder) || !isNil(updateOrderBy)) {
      updateOrder(isAsc ? 'desc' : 'asc');
      updateOrderBy(property);
    }
  };

  const handleChangePage = (event, newPage) => {
    if (!isNil(updateCurrentPage)) {
      updateCurrentPage(newPage);
      updateSelection({});
    }
  };

  const handleChangeRowsPerPage = (event) => {
    if (!isNil(updateRowsPerPage)) {
      updateRowsPerPage(parseInt(event.target.value, 10));
    }
    if (!isNil(updateCurrentPage)) {
      updateCurrentPage(0);
    }
  };

  return (
    <Wrapper variant="outlined">
      <Toolbar>
        {!isNil(title) && (
          <Typography variant="h6" id="tableTitle" component="div">
            {title}
          </Typography>
        )}
        <VisibleColumnsMenu
          allColumns={columns}
          updateHiddenColumns={updateHiddenColumns}
          hiddenColumns={hiddenColumns}
        />
      </Toolbar>
      <Divider light />
      <TableContainer>
        <MuiTable size="small">
          <TableHead
            visibleColumns={getVisibleColumns(columns)}
            onSort={
              !isNil(updateOrder) && !isNil(updateOrderBy)
                ? handleSort
                : undefined
            }
            orderBy={orderBy}
            order={order}
            isInitializing={isFirstLoad}
            customHeaderCellRenders={getCustomHeaderCellRenders}
          />
          <TableBody $loading={loading}>
            {isFirstLoad ? (
              <InitialTable />
            ) : (
              data.map((row) => (
                <Row
                  key={row.id}
                  row={row}
                  checked={isSelected(row.id)}
                  onSelection={
                    !isNil(updateSelection)
                      ? handleSelection(row.id)
                      : undefined
                  }
                  onOpenDetailedView={openDetailedView}
                  hiddenColumns={hiddenColumns}
                  customCellRenders={getCustomCellRenders}
                />
              ))
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
      {loading && <LinearProgress color="secondary" />}
      <TableFooter>
        <SelectedTypography color="secondary" variant="caption" component="div">
          {!isNil(updateSelection) &&
            !isNil(selection) &&
            `${selection.length || 0} ${formatMessage({ id: 'Selected' })}`}
        </SelectedTypography>
        {updateCurrentPage && (
          <TablePagination
            rowsPerPageOptions={isNil(updateRowsPerPage) ? [50] : [5, 50, 100]}
            component="div"
            count={rowsCount}
            rowsPerPage={rowsPerPage}
            page={currentPage}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        )}
      </TableFooter>
    </Wrapper>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
      ]),
      label: PropTypes.string,
    }),
  ).isRequired,
  currentPage: PropTypes.number,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
      ]),
    }),
  ).isRequired,
  hiddenColumns: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.number.isRequired,
    ]),
  ).isRequired,
  loading: PropTypes.bool,
  openDetailedView: PropTypes.func,
  order: PropTypes.oneOf(['asc', 'desc']),
  orderBy: PropTypes.string,
  rowsCount: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number,
  selection: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.number.isRequired,
    ]),
  ),
  title: PropTypes.string,
  updateCurrentPage: PropTypes.func,
  updateHiddenColumns: PropTypes.func.isRequired,
  updateOrder: PropTypes.func,
  updateOrderBy: PropTypes.func,
  updateRowsPerPage: PropTypes.func,
  updateSelection: PropTypes.func,
  customHeaderCellRenders: PropTypes.arrayOf(
    PropTypes.shape({
      customRender: PropTypes.func.isRequired,
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
      ]),
    }),
  ),
  customCellRenders: PropTypes.arrayOf(
    PropTypes.shape({
      customRender: PropTypes.func.isRequired,
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
      ]),
    }),
  ),
};

export default Table;
