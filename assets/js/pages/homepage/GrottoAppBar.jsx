import React from 'react';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import Dialog from 'material-ui/Dialog';
import muiThemeable from 'material-ui/styles/muiThemeable';
import LanguagePicker from './../../components/LanguagePicker';

class GrottoAppBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  openSignInDialog(event, index, value) {
    this.setState({open: true});
  }

  closeSignInDialog(event, index, value) {
    this.setState({open: false});
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
      <Toolbar className="gcAppBar">
        <ToolbarGroup firstChild={true}>
          <FontIcon className="material-icons" style={{color: this.props.muiTheme.grottoAppBar.textColor}}>language</FontIcon>
          <LanguagePicker/>
        </ToolbarGroup>

        <ToolbarGroup>
          <IconMenu iconButtonElement={
            <IconButton iconStyle={{color: this.props.muiTheme.grottoAppBar.textColor}} touch={true}>
              <NavigationExpandMoreIcon />
            </IconButton>
          }>
            <MenuItem primaryText="Register" onTouchTap={this.openRegisterDialog.bind(this)}/>
          </IconMenu>
          </ToolbarGroup>
        <Dialog
          title="Signin Form"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.closeRegisterDialog.bind(this)}
        >
          TODO: Signin form
        </Dialog>
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

export default muiThemeable()(GrottoAppBar);
