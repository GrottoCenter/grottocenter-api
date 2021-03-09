import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import React from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from '@material-ui/core/styles';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';

import Translate from '../Translate';

const UserMenu = ({
  authTokenExpirationDate,
  isAuth,
  userNickname,
  onLoginClick,
  onLogoutClick,
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { formatDate, formatMessage, formatTime } = useIntl();
  const theme = useTheme();

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

  const isSessionExpired = authTokenExpirationDate < Date.now();

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
            <MenuItem disabled>
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
            <MenuItem
              divider
              disabled
              style={isSessionExpired ? { opacity: 1 } : {}}
            >
              {isSessionExpired ? (
                <span style={{ color: theme.palette.errorColor }}>
                  {formatMessage({
                    id: 'Your session has expired: please log in again.',
                  })}
                </span>
              ) : (
                <>
                  {formatMessage(
                    {
                      id:
                        'Expiration Date: {expirationDate} at {expirationHourAndMinutes}',
                      defaultMessage:
                        'Expiration Date: {expirationDate} at {expirationHourAndMinutes}',
                    },
                    {
                      expirationDate: (
                        <span>
                          &nbsp;{formatDate(authTokenExpirationDate)}&nbsp;
                        </span>
                      ),
                      expirationHourAndMinutes: (
                        <span>&nbsp;{formatTime(authTokenExpirationDate)}</span>
                      ),
                    },
                  )}
                </>
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
  authTokenExpirationDate: PropTypes.instanceOf(Date),
  userNickname: PropTypes.string,
  isAuth: PropTypes.bool.isRequired,
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
};

export default UserMenu;
