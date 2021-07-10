import React from 'react';
import { TableCell } from '@material-ui/core';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';

const CustomCell = ({ id, value, customRenders }) => {
  const customRender =
    !isNil(customRenders) && !isNil(customRenders(id))
      ? customRenders(id)
      : undefined;

  return (
    <TableCell align="right">
      {!isNil(customRender) ? customRender(value) : value || ''}
    </TableCell>
  );
};

CustomCell.propTypes = {
  id: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
  ]),
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
      ]),
    ),
    // eslint-disable-next-line react/forbid-prop-types
    PropTypes.any,
  ]),
  customRenders: PropTypes.func,
};

export default CustomCell;
