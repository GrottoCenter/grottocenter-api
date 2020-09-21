import {
  TableCell,
  TableHead as MuiTableHead,
  TableRow,
  TableSortLabel,
} from '@material-ui/core';
import {
  defaultTo,
  head,
  includes,
  isNil,
  keys,
  map,
  pipe,
  values,
} from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { InitialHead } from './InitialTable';

export const ActionColumnIds = {
  selection: 'selection',
  detailedView: 'detailedView',
};

export const createColumns = (rawData, makeTranslation) => {
  const makeColumn = (key) => ({
    label: makeTranslation(key),
    id: key,
  });

  return pipe(head, defaultTo({}), keys, map(makeColumn))(rawData);
};

const TableHead = ({
  visibleColumns,
  onSort,
  orderBy,
  order,
  isInitializing,
}) => (
  <MuiTableHead>
    <TableRow>
      {isInitializing ? (
        <InitialHead />
      ) : (
        visibleColumns.map(({ id, label }) => (
          <TableCell key={id} align="right">
            {!isNil(onSort) && !includes(id, values(ActionColumnIds)) ? (
              <TableSortLabel
                active={orderBy === id}
                direction={orderBy === id ? order : 'asc'}
                onClick={onSort(id)}
              >
                {label || ''}
              </TableSortLabel>
            ) : (
              label
            )}
          </TableCell>
        ))
      )}
    </TableRow>
  </MuiTableHead>
);

TableHead.propTypes = {
  visibleColumns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
      ]),
    }),
  ).isRequired,
  onSort: PropTypes.func,
  orderBy: PropTypes.string,
  order: PropTypes.oneOf(['asc', 'desc']),
  isInitializing: PropTypes.bool,
};

export default TableHead;
