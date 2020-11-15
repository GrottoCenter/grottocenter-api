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
  AutoCompleteSearch,
  isAuth,
  onLoginClick,
  onLogoutClick,
  toggleMenu,
  userNickname,
}) => (
  <>
    <StyledMuiAppBar>
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
            <Typography variant="h4">
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
          userNickname={userNickname}
        />
      </Toolbar>
    </StyledMuiAppBar>
    <Toolbar variant="dense" />
  </>
);

AppBar.propTypes = {
  AutoCompleteSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]),
  toggleMenu: PropTypes.func.isRequired,
  isAuth: PropTypes.bool.isRequired,
  onLoginClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
  userNickname: PropTypes.string,
};

export default AppBar;
