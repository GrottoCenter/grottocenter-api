import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';

import Translate from '../Translate';

const UserMenu = ({ onLoginClick, onLogoutClick, isAuth }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Before using onLogoutClick(), we need to handle the menu closing
  // to detach the popover menu before the account icon/button changes.
  const handleLogoutClick = () => {
    handleClose();
    onLogoutClick();
  };

  return (
    <>
      {!isAuth ? (
        <span>
          <Button startIcon={<AccountCircle />} onClick={onLoginClick}>
            {!isMobileOnly && <Translate>Log in</Translate>}
          </Button>
        </span>
      ) : (
        <>
          <IconButton
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
            <MenuItem onClick={handleLogoutClick}>
              <Translate>Log out</Translate>
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  );
};

UserMenu.propTypes = {
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
  isAuth: PropTypes.bool.isRequired,
};

export default UserMenu;
