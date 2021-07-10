import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';

const Modal = ({ children }) => (
  <Dialog open modal>
    {children}
  </Dialog>
);

Modal.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Modal;
