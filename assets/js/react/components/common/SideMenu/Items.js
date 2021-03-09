import React, { useState } from 'react';
import DescriptionIcon from '@material-ui/icons/Description';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { Collapse, List, ListItemIcon, ListItemText } from '@material-ui/core';
import DocumentList from '@material-ui/icons/PlaylistAddCheck';
import PropTypes from 'prop-types';

import { isNil } from 'ramda';
import Translate from '../Translate';
import { Icon, StyledLink, StyledListItem } from './styles';

const Item = ({
  ItemIcon,
  label,
  nested = false,
  onClick = () => {},
  children,
}) => (
  <StyledListItem button $nested={nested} onClick={onClick}>
    <ListItemIcon>
      <ItemIcon />
    </ListItemIcon>
    <ListItemText>
      <Translate>{label}</Translate>
    </ListItemText>
    {!isNil(children) && children}
  </StyledListItem>
);

export const LinkedItem = ({ href = '', ...itemProps }) => (
  <StyledLink to={href}>
    <Item {...itemProps} />
  </StyledLink>
);

const AddDocument = () => (
  <LinkedItem
    ItemIcon={() => (
      <Icon src="/images/sidemenu/add-document.png" alt="add document icon" />
    )}
    label="Add a BBS document"
    href="/ui/documents/add"
    nested
  />
);

export const DocumentItems = ({ isModerator = true, isUser = true }) => {
  const [isDocumentCollapsed, setIsDocumentCollapsed] = useState(false);

  const toggleIsDocumentCollapsed = () => {
    setIsDocumentCollapsed(!isDocumentCollapsed);
  };

  return (
    (isUser || isModerator) && (
      <>
        <Item
          onClick={toggleIsDocumentCollapsed}
          ItemIcon={() => <DescriptionIcon color="primary" />}
          label="Document"
        >
          {isDocumentCollapsed ? <ExpandLess /> : <ExpandMore />}
        </Item>
        <Collapse in={isDocumentCollapsed} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {isUser && <AddDocument />}
            {isModerator && (
              <LinkedItem
                ItemIcon={() => <DocumentList color="primary" />}
                label="Document validation"
                href="/ui/documents/validation"
                nested
              />
            )}
          </List>
        </Collapse>
      </>
    )
  );
};

Item.propTypes = {
  ItemIcon: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  nested: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
};

LinkedItem.propTypes = {
  href: PropTypes.string,
  ...Item.propTypes,
};

DocumentItems.propTypes = {
  isModerator: PropTypes.bool,
  isUser: PropTypes.bool,
};

export default LinkedItem;
