import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle,
} from '@material-ui/core';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';

const CustomDialogTitle = styled(DialogTitle)`
  margin-top: 1rem;
`;

const DialogContent = styled(MuiDialogContent)`
  && {
    overflow: visible;
  }
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  right: 0;
`;

const StandardDialog = ({
  fullScreen = false,
  fullWidth = false,
  maxWidth = 'sm',
  open = false,
  onClose = () => {},
  title,
  children,
  actions,
}) => (
  <Dialog
    fullScreen={fullScreen}
    fullWidth={fullWidth}
    maxWidth={maxWidth}
    open={open}
    onClose={onClose}
    PaperProps={{ style: { overflow: 'visible' } }}
  >
    {onClose && (
      <CloseButton aria-label="close" onClick={onClose} color="primary">
        <CloseIcon />
      </CloseButton>
    )}
    <CustomDialogTitle>{title}</CustomDialogTitle>
    {children && <DialogContent>{children}</DialogContent>}
    <DialogActions>{actions || null}</DialogActions>
  </Dialog>
);

export default StandardDialog;

StandardDialog.propTypes = {
  // eslint-disable-next-line react/require-default-props
  fullScreen: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  actions: PropTypes.arrayOf(PropTypes.node),
  children: PropTypes.node,
};
