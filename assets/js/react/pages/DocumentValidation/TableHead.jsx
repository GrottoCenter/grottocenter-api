import {
  Checkbox,
  TableCell,
  TableRow,
  TableHead,
  TableSortLabel,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { useIntl } from 'react-intl';

function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    columnNames,
  } = props;
  const { formatMessage } = useIntl();
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all desserts' }}
          />
        </TableCell>
        {columnNames.map((column) => (
          <TableCell
            key={column}
            sortDirection={orderBy === column ? order : false}
          >
            <TableSortLabel
              active={orderBy === column}
              direction={orderBy === column ? order : 'asc'}
              onClick={createSortHandler(column)}
            >
              {formatMessage({ id: column })}
              {orderBy === column ? (
                <span>
                  {formatMessage({
                    id:
                      order === 'desc'
                        ? 'sorted descending'
                        : 'sorted ascending',
                  })}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
  columnNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

export default EnhancedTableHead;
