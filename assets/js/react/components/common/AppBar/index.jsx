import React from 'react';
import PropTypes from 'prop-types';
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  Link,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import LanguageSelector from '../LanguageSelector';
import UserMenu from './User';
import { logoGC } from '../../../conf/Config';
import Login from '../../../features/Login';

const StyledMuiAppBar = styled(MuiAppBar)`
  flex-grow: 1;
`;

const LanguageWrapper = styled.div`
  height: 56px;
  padding: ${(props) => props.theme.spacing(2)}px;
`;

const SearchWrapper = styled.div`
  padding: ${(props) => props.theme.spacing(2)}px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: baseline;
`;

const LogoImage = styled.img`
  height: ${isMobileOnly ? '25' : '30'}px;
  padding-right: ${(props) => props.theme.spacing(2)}px;
`;

const RightWrapper = styled.div`
  margin-left: auto;
  display: flex;
`;

const AppBar = ({
  toggleMenu,
  isAuth,
  AutoCompleteSearch,
  onLoginClick,
  onLogoutClick,
}) => (
  <>
    <StyledMuiAppBar>
      <StandardDialog
        open={LoginManager.open}
        onClose={LoginManager.onClose}
        title={LoginManager.title}
        actions={LoginManager.actions}
      >
        <LoginForm
          onLogin={LoginManager.onLogin}
          email={LoginManager.email}
          onEmailChange={LoginManager.onEmailChange}
          password={LoginManager.password}
          onPasswordChange={LoginManager.onPasswordChange}
          isFetching={LoginManager.isFetching}
          authError={LoginManager.authError}
        />
      </StandardDialog>

      <Toolbar variant="dense">
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleMenu}
        >
          <MenuIcon />
        </IconButton>
        <TitleWrapper>
          <LogoWrapper>
            <Typography variant="h5">
              <Link href="/" color="inherit">
                <LogoImage src={logoGC} alt="Grottocenter" />
                {!isMobileOnly && `Grottocenter`}
              </Link>
            </Typography>
          </LogoWrapper>
        </TitleWrapper>
        <RightWrapper>
          {!!AutoCompleteSearch && !isMobileOnly && (
            <SearchWrapper>
              <AutoCompleteSearch />
            </SearchWrapper>
          )}
          <LanguageWrapper>
            <LanguageSelector />
          </LanguageWrapper>
        </RightWrapper>
        <UserMenu
          isAuth={isAuth}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
        />
      </Toolbar>
    </StyledMuiAppBar>
    <Toolbar variant="dense" />
  </>
);

AppBar.propTypes = {
  toggleMenu: PropTypes.func.isRequired,
};

export default AppBar;

AppBar.propTypes = {
  toggleMenu: PropTypes.func.isRequired,
  // eslint-disable-next-line react/require-default-props
  isAuth: PropTypes.bool.isRequired,
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
  AutoCompleteSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]),
  AppBarManager: PropTypes.shape({
    toggleMenu: PropTypes.func.isRequired,
    isAuth: PropTypes.bool.isRequired,
    onLoginClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
  }),
  LoginManager: PropTypes.shape({
    onLogin: PropTypes.func.isRequired,
    email: PropTypes.string.isRequired,
    onEmailChange: PropTypes.func.isRequired,
    password: PropTypes.string.isRequired,
    onPasswordChange: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.shape({}).isRequired,
    actions: PropTypes.array.isRequired,
    authError: PropTypes.string,
  }),
};
