import React from 'react';
import Badge from 'material-ui/Badge';
import IconButton from 'material-ui/IconButton';
import NotificationsIcon from 'material-ui/svg-icons/social/notifications';

const Notifications = () => (
  <Badge
    badgeContent={1}
    secondary={true}
    badgeStyle={{top: 20, right: 20}}
  >
    <IconButton tooltip="Notifications">
      <NotificationsIcon />
    </IconButton>
  </Badge>
);

export default Notifications;
