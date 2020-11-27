import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { List } from '@material-ui/core';
import Item, { DocumentItems } from './Items';
import { Icon } from './styles';
import isAuth, {
  isModerator,
  isUser as hasUserRole,
} from '../../../helpers/AuthHelper';

const MenuLinks = () => {
  const [isUserAuth, setIsUserAuth] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isUserModerator, setIsUserModerator] = useState(false);
  const authState = useSelector((state) => state.auth);
  useEffect(() => {
    setIsUserAuth(isAuth());
    setIsUser(hasUserRole());
    setIsUserModerator(isModerator());
  }, [isUserAuth, isUser, isUserModerator, authState]);

  return (
    <List component="nav" aria-label="main mailbox folders">
      <Item
        ItemIcon={() => (
          <Icon src="/images/sidemenu/home.png" alt="home icon" />
        )}
        label="Home page"
        href="/"
      />
      {isUserAuth && (
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
      <DocumentItems isModerator={isUserModerator} isUser={isUser} />
    </List>
  );
};

export default MenuLinks;
