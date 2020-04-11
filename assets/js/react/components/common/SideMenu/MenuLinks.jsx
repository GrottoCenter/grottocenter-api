import React from 'react';
import { Link } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Translate from '../Translate';

const Icon = styled.img`
  width: 20px;
`;

const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;

const Item = ({ ItemIcon, label, href }) => (
  <StyledLink to={href}>
    <ListItem button href={href}>
      <ListItemIcon>
        <ItemIcon />
      </ListItemIcon>
      <ListItemText>
        <Translate>{label}</Translate>
      </ListItemText>
    </ListItem>
  </StyledLink>
);

const MenuLinks = () => (
  <List component="nav" aria-label="main mailbox folders">
    <Item
      ItemIcon={() => <Icon src="/images/sidemenu/home.png" alt="home icon" />}
      label="Home page"
      href="/"
    />
    <Item
      ItemIcon={() => <Icon src="/images/sidemenu/search.png" alt="search icon" />}
      label="Advanced search"
      href="#"
    />
    <Item
      ItemIcon={() => <Icon src="/images/sidemenu/loc.png" alt="map icon" />}
      label="Map"
      href="/ui/map"
    />
    <Item
      ItemIcon={() => <Icon src="/images/sidemenu/wrench.png" alt="wrench icon" />}
      label="Toolbox"
      href="#"
    />
  </List>
);

Item.propTypes = {
  ItemIcon: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
};

export default MenuLinks;
