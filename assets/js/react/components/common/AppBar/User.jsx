import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import React from 'react';
import { useIntl } from 'react-intl';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';

import Translate from '../Translate';

const UserMenu = ({ isAuth, userNickname, onLoginClick, onLogoutClick }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { formatMessage } = useIntl();

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
        <Button
          color="inherit"
          onClick={onLoginClick}
          startIcon={<AccountCircle />}
          variant="text"
        >
          {!isMobileOnly && <Translate>Log in</Translate>}
        </Button>
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
            <MenuItem divider disabled>
              {formatMessage(
                {
                  id: 'Logged as {userNickname}',
                  defaultMessage: 'Logged as {userNickname}',
                },
                {
                  userNickname: (
                    <span>
                      &nbsp;<b>{userNickname}</b>
                    </span>
                  ),
                },
              )}
            </MenuItem>
            <MenuItem disabled>
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
  userNickname: PropTypes.string,
  isAuth: PropTypes.bool.isRequired,
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
};

export default UserMenu;
