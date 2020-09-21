import React from 'react';
import { Checkbox, IconButton, TableCell, TableRow } from '@material-ui/core';
import { includes, isNil, keys } from 'ramda';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import PropTypes from 'prop-types';
import CustomCell from './CustomCell';

const Row = ({
  row,
  onOpenDetailedView,
  onSelection,
  checked,
  hiddenColumns,
  customCellRenders,
}) => {
  const handleOpenDetailedView = (id) => () => {
    if (!isNil(onOpenDetailedView)) {
      onOpenDetailedView(id);
    }
  };

  return (
    <TableRow hover={!isNil(onSelection)}>
      {!isNil(onSelection) && (
        <TableCell padding="checkbox">
          <Checkbox
            onClick={onSelection}
            checked={checked}
            inputProps={{ 'aria-labelledby': row.id }}
          />
        </TableCell>
      )}
      {!isNil(onOpenDetailedView) && (
        <TableCell padding="checkbox">
          <IconButton
            aria-label="detailed view"
            onClick={handleOpenDetailedView(row.id)}
            size="small"
          >
            <ZoomInIcon />
          </IconButton>
        </TableCell>
      )}
      {keys(row).map(
        (keyCell) =>
          !includes(keyCell, hiddenColumns) && (
            <CustomCell
              key={keyCell}
              value={row[keyCell]}
              id={keyCell}
              customRenders={
                !isNil(customCellRenders) ? customCellRenders : undefined
              }
            />
          ),
      )}
    </TableRow>
  );
};

Row.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.number.isRequired,
    ]),
  }),
  checked: PropTypes.bool.isRequired,
  onOpenDetailedView: PropTypes.func,
  onSelection: PropTypes.func,
  hiddenColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  customCellRenders: PropTypes.func,
};

export default Row;
