import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle,
} from '@material-ui/core';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const DialogContent = styled(MuiDialogContent)`
  && {
    overflow: visible;
  }
`;

const StandardDialog = ({
  fullScreen = false,
  fullWidth = false,
  maxWidth = 'sm',
  buttonType = 'button',
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
    <DialogTitle>{title}</DialogTitle>
    {children && <DialogContent>{children}</DialogContent>}
    <DialogActions>
      <Button color="primary" type={buttonType} onClick={onClose}>
        <FormattedMessage id="Close" />
      </Button>
      {actions || null}
    </DialogActions>
  </Dialog>
);

export default StandardDialog;

StandardDialog.propTypes = {
  // eslint-disable-next-line react/require-default-props
  buttonType: PropTypes.oneOf(['button', 'submit']),
  fullScreen: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  actions: PropTypes.arrayOf(PropTypes.node),
  children: PropTypes.node,
};
