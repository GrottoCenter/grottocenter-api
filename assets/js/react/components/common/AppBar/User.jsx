import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';
import Translate from '../Translate';
import DisabledTooltip from '../DisabledTooltip';

// eslint-disable-next-line no-unused-vars
const UserMenu = ({ onLogout, disabled = true, isAuth = false }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {!isAuth ? (
        <DisabledTooltip disabled={disabled}>
          <span>
            <Button startIcon={<AccountCircle />} color="inherit" disabled={disabled}>
              {!isMobileOnly && <Translate>Login</Translate>}
            </Button>
          </span>
        </DisabledTooltip>
      ) : (
        <>
          <IconButton
            disabled={disabled}
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <Translate>Profile</Translate>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Translate>My Account</Translate>
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  );
};

UserMenu.propTypes = {
  // eslint-disable-next-line react/require-default-props
  onLogout: PropTypes.func,
  // eslint-disable-next-line react/require-default-props
  disabled: PropTypes.bool,
  isAuth: PropTypes.bool.isRequired,
};

export default UserMenu;
