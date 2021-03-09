import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Snackbar } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

// ==========

const StatusMessage = ({ message, severity }) => {
  const [open, setOpen] = useState(true);
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
    >
      <MuiAlert onClose={handleClose} severity={severity}>
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

StatusMessage.propTypes = {
  message: PropTypes.node.isRequired,
  severity: PropTypes.string.isRequired,
};

export default StatusMessage;
