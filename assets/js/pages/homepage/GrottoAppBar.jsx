import React from 'react';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import Dialog from 'material-ui/Dialog';
import muiThemeable from 'material-ui/styles/muiThemeable';
import LanguagePicker from './../../components/LanguagePicker';
import SigninForm from './../../components/SigninForm';

class GrottoAppBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openSignIn: false,
      openRegister: false
    };
  }

  openSignInDialog(event, index, value) {
    this.setState({openSignIn: true});
  }

  closeSignInDialog(event, index, value) {
    this.setState({openSignIn: false});
  }

  openRegisterDialog(event, index, value) {
    this.setState({openRegister: true});
  }

  closeRegisterDialog(event, index, value) {
    this.setState({openRegister: false});
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
    const actionsSignIn = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.closeSignInDialog.bind(this)}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.closeSignInDialog.bind(this)}
      />,
    ];

    const actionsRegister = [
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
      <Toolbar style={{backgroundColor: this.props.muiTheme.palette.primary1Color}} className="gcAppBar">
        <ToolbarGroup firstChild={true}>
          <FontIcon className="material-icons" style={{color: this.props.muiTheme.palette.textIconColor}}>language</FontIcon>
          <LanguagePicker/>
        </ToolbarGroup>

        <ToolbarGroup>
          <IconMenu iconButtonElement={
            <IconButton iconStyle={{color: this.props.muiTheme.palette.textIconColor}} touch={true}>
              <MoreVertIcon />
            </IconButton>
          }>
            <MenuItem primaryText="Sign In" onTouchTap={this.openSignInDialog.bind(this)}/>
            <MenuItem primaryText="Register" onTouchTap={this.openRegisterDialog.bind(this)}/>
          </IconMenu>
        </ToolbarGroup>
        <Dialog
          title="SignIn Form"
          actions={actionsSignIn}
          modal={false}
          open={this.state.openSignIn}
          onRequestClose={this.closeSignInDialog.bind(this)}
          autoScrollBodyContent={true}
        >
          <SigninForm/>
        </Dialog>
        <Dialog
          title="Register Form"
          actions={actionsRegister}
          modal={false}
          open={this.state.openRegister}
          onRequestClose={this.closeRegisterDialog.bind(this)}
        >
          TODO: register form
        </Dialog>
      </Toolbar>
    );
  }
}

export default muiThemeable()(GrottoAppBar);
