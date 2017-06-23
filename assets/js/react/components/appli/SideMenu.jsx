import React from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import NotificationsIcon from 'material-ui/svg-icons/social/notifications';

export default class SideMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
    this.handleToggle = this.handleToggle.bind(this);
  }

  handleToggle() {
    this.setState({open: !this.state.open});
  }

  render() {
    return (
      <div>
        <RaisedButton onTouchTap={this.handleToggle}>
          <NotificationsIcon/>
        </RaisedButton>
        <Drawer width={200} open={this.state.open} containerStyle={{top: '120px'}}>
          <MenuItem>Menu Item</MenuItem>
          <MenuItem>Menu Item 2</MenuItem>
        </Drawer>
      </div>
    );
  }
}
