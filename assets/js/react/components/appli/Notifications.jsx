import React from 'react';
import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import NotificationsIcon from '@material-ui/icons/Notifications';

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
