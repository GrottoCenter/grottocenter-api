import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';

const Modal = (props) => (
  <Dialog open modal>
    {props.children}
  </Dialog>
);

Modal.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Modal;
