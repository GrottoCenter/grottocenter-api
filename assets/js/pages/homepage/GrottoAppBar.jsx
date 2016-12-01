import React from 'react';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';
import FlatButton from 'material-ui/FlatButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';

import LanguagePicker from './../../components/LanguagePicker';

export default class GrottoAppBar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        open: false,
    };
  }
  openRegisterDialog(event, index, value) {
    this.setState({open: true});
  }
  closeRegisterDialog(event, index, value) {
    this.setState({open: false});
  }
  processLogin(event, index, value) {
    console.log("processLogin",this.refs.login.getValue(),this.refs.password.getValue());

    $.ajax({
      url: "/csrfToken",
      dataType: 'json',
      success: function(data) {
        $.post('/auth/login', {
          contact: this.refs.login.getValue(),
          password: this.refs.password.getValue(),
          _csrf: data._csrf
      }, this.loginSuccess.bind(this), this.loginFail.bind(this))
      }.bind(this)
    });
  }
  loginFail(data) {
      console.log("loginFail",data);
  }
  loginSuccess(userData) {
      console.log("loginSuccess",userData);
  }
  render() {
      const actions = [
        <FlatButton
          label="Cancel"
          primary={true}
          onTouchTap={this.closeRegisterDialog.bind(this)}
        />,
        <FlatButton
          label="Submit"
          primary={true}
          keyboardFocused={true}
          onTouchTap={this.closeRegisterDialog.bind(this)}
        />,
      ];

    return (
      <Toolbar
          style={{
             backgroundColor: '#55ffd699',
           }}>
        <ToolbarGroup firstChild={true}>
            <ToolbarTitle text="Grottocenter" />
            <ToolbarSeparator />
            <FontIcon className="material-icons">language</FontIcon>
            <LanguagePicker/>
        </ToolbarGroup>
        <ToolbarGroup>
            <TextField
                ref="login"
                hintText="Login"
            />
            <TextField
                ref="password"
                hintText="Password"
                type="password"
            />
        <FontIcon className="material-icons" onTouchTap={this.processLogin.bind(this)}>account_circle</FontIcon>
          <IconMenu
            iconButtonElement={
              <IconButton touch={true}>
                <NavigationExpandMoreIcon />
              </IconButton>
            }
          >
            <MenuItem primaryText="Register" onTouchTap={this.openRegisterDialog.bind(this)}/>
          </IconMenu>
        </ToolbarGroup>
        <Dialog
          title="Register Form"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.closeRegisterDialog.bind(this)}
        >
          TODO: register form
        </Dialog>
      </Toolbar>
    );
  }
}
