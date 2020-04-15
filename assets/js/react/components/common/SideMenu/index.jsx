import React from 'react';
import { Divider, Drawer, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Translate from '../Translate';
import MenuLinks from './MenuLinks';
import Footer from './Footer';

const UserIcon = styled.img`
  width: 40px;
  src: url('/images/sidemenu/user.png');
`;

const SideMenu = ({
  isOpen,
  toggle,
  isConnected = false,
  AutoCompleteSearch,
}) => (
  <Drawer variant="persistent" anchor="left" open={isOpen} onClose={toggle}>
    <UserInformation isConnected={isConnected} />
    {!!AutoCompleteSearch && <AutoCompleteSearch />}
    <Divider />
    <MenuLinks />
    <Footer />
  </Drawer>
);

const UserContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: center;
`;

const UserInformation = ({ isConnected = false }) => (
  <UserContainer>
    {isConnected ? (
      <>
        <UserIcon src="/images/sidemenu/user.png" alt="user icon" />
        <Typography>
          <Translate>Hello</Translate>
          User
        </Typography>
      </>
    ) : (
      <>
        <Typography variant="caption" fontWeight="fontWeightBold">
          <Translate>You are not logged in.</Translate>
        </Typography>
        <Typography variant="caption">
          <Translate>Log in to activate the editor mode.</Translate>
        </Typography>
      </>
    )}
  </UserContainer>
);

SideMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  isConnected: PropTypes.bool,
  AutoCompleteSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]),
};

UserInformation.propTypes = {
  isConnected: PropTypes.bool,
};

export default SideMenu;
