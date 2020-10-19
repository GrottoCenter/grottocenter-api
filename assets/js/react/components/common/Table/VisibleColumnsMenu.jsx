import React from 'react';
import {
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { includes, without, __, values } from 'ramda';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

export const ActionColumnIds = {
  selection: 'selection',
  detailedView: 'detailedView',
};
export const isActionColumn = includes(__, values(ActionColumnIds));

const VisibleColumnsMenu = ({
  updateHiddenColumns,
  hiddenColumns,
  allColumns,
}) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUpdateHiddenColumns = (id) => () => {
    updateHiddenColumns(
      includes(id, hiddenColumns)
        ? without(id, hiddenColumns)
        : [...hiddenColumns, id],
    );
  };

  return (
    <>
      <IconButton aria-label="visible columns button" onClick={handleClick}>
        <VisibilityOffIcon />
      </IconButton>
      <Menu
        id="column-selection"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem key="label" disabled>
          {formatMessage({ id: 'Hidden columns' })}
        </MenuItem>
        {allColumns.map((column) => (
          <MenuItem
            key={column.id}
            button
            onClick={handleUpdateHiddenColumns(column.id)}
          >
            <ListItemIcon>
              <Checkbox
                size="small"
                checked={includes(column.id, hiddenColumns)}
                onChange={() => {}}
                name={column.id}
              />
            </ListItemIcon>
            <ListItemText
              id={column.id}
              primary={formatMessage({ id: column.label })}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

VisibleColumnsMenu.propTypes = {
  allColumns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  hiddenColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  updateHiddenColumns: PropTypes.func.isRequired,
};

const MemoizedVisibleColumnsMenu = React.memo(VisibleColumnsMenu);

export default MemoizedVisibleColumnsMenu;
