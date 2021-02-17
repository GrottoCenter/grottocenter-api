import { TableHead as MuiTableHead, TableRow } from '@material-ui/core';
import {
  __,
  concat,
  defaultTo,
  filter,
  head,
  isNil,
  keys,
  map,
  pipe,
} from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { InitialHead } from './InitialTable';
import CustomHeaderCell from './CustomHeaderCell';

export const createColumns = (rawData, makeTranslation) => {
  const makeColumn = (key) => ({
    label: makeTranslation(key),
    id: key,
  });

  return pipe(head, defaultTo({}), keys, map(makeColumn))(rawData);
};

export const createDefaultHiddenColumns = (columns, defaults) =>
  pipe(
    filter((column) => column.id[0] === '@'),
    map((column) => column.id),
    concat(__, defaults),
  )(columns);

const TableHead = ({
  visibleColumns,
  isInitializing,
  customHeaderCellRenders,
  ...orderProps
}) => (
  <MuiTableHead>
    <TableRow>
      {isInitializing ? (
        <InitialHead />
      ) : (
        visibleColumns.map(({ id, label }) => (
          <CustomHeaderCell
            key={id}
            value={label}
            id={id}
            customRenders={
              !isNil(customHeaderCellRenders)
                ? customHeaderCellRenders
                : undefined
            }
            {...orderProps}
          />
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
  customHeaderCellRenders: PropTypes.func,
};

export default TableHead;
