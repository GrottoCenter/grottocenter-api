import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@material-ui/core';

import Translate from '../Translate';

const DisabledTooltip = ({ disabled, children }) => {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    if (disabled) {
      setOpen(true);
    }
  };

  return (
    <Tooltip
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      title={<Translate>disabled</Translate>}
    >
      {children}
    </Tooltip>
  );
};

DisabledTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default DisabledTooltip;
