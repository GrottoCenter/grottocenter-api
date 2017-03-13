import React, {PropTypes} from 'react';

import Dialog from 'material-ui/Dialog';

const Modal = (props) => (
  <Dialog open={true} modal={true}>
    {props.children}
  </Dialog>
);

Modal.propTypes = {
  children: PropTypes.node.isRequired
};

export default Modal;
