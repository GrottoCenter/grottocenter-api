import React from 'react';
import { useSelector } from 'react-redux';
import { List } from '@material-ui/core';
import Item, { DocumentItems } from './Items';
import { Icon } from './styles';

import { isModerator, isUser, isUserAuth } from '../../../helpers/AuthHelper';

const MenuLinks = () => {
  const authState = useSelector((state) => state.auth);
  return (
    <List component="nav" aria-label="main mailbox folders">
      <Item
        ItemIcon={() => (
          <Icon src="/images/sidemenu/home.png" alt="home icon" />
        )}
        label="Home page"
        href="/"
      />
      {isUserAuth(authState) && (
        <Item
          ItemIcon={() => (
            <Icon src="/images/sidemenu/dashboard.png" alt="dashboard icon" />
          )}
          label="Dashboard"
          href="/ui"
        />
      )}
      <Item
        ItemIcon={() => (
          <Icon src="/images/sidemenu/search.png" alt="search icon" />
        )}
        label="Advanced search"
        href="/ui/search"
      />
      <Item
        ItemIcon={() => <Icon src="/images/sidemenu/loc.png" alt="map icon" />}
        label="Map"
        href="/ui/map"
      />
      <Item
        ItemIcon={() => (
          <Icon src="/images/sidemenu/wrench.png" alt="wrench icon" />
        )}
        label="Toolbox"
        href="#"
      />
      <DocumentItems
        isModerator={isModerator(authState)}
        isUser={isUser(authState)}
      />
    </List>
  );
};

export default MenuLinks;
