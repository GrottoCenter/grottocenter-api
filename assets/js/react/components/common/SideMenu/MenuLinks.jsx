import React from 'react';
import { List } from '@material-ui/core';
import Item, { DocumentItems } from './Items';
import { Icon } from './styles';

import { usePermissions } from '../../../hooks';

const MenuLinks = () => {
  const permissions = usePermissions();
  return (
    <List component="nav" aria-label="main mailbox folders">
      <Item
        ItemIcon={() => (
          <Icon src="/images/sidemenu/home.png" alt="home icon" />
        )}
        label="Home page"
        href="/"
      />
      {permissions.isAuth && (
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
        isModerator={permissions.isModerator}
        isUser={permissions.isUser}
      />
    </List>
  );
};

export default MenuLinks;
