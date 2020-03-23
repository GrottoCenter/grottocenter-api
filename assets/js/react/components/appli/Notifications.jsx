import React from 'react';
import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import NotificationsIcon from '@material-ui/icons/Notifications';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

//
//
// M A I N - C O M P O N E N T
//
//

const Notifications = () => (
  <Badge badgeContent={1} secondary badgeStyle={{ top: 20, right: 20 }}>
    <IconButton tooltip="Notifications">
      <NotificationsIcon />
    </IconButton>
  </Badge>
);

export default Notifications;
