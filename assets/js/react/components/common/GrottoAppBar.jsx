import React, {Component} from 'react';
import PropTypes from 'prop-types';
import IconMenu from '@material-ui/core/Menu';
import IconButton from '@material-ui/core/IconButton';
import FontIcon from '@material-ui/core/Icon';
import MoreVertIcon from '@material-ui/icons/Navigation';
import MenuItem from '@material-ui/core/MenuItem';
import FlatButton from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Dialog from '@material-ui/core/Dialog';
import { withTheme } from '@material-ui/core/styles';
import LanguagePicker from '../../containers/LanguagePicker';
import SigninForm from '../SigninForm';
import styled from 'styled-components';

const FlexDiv = styled.div`
  display: inline-flex;
`;

class GrottoAppBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openSignIn: false,
      openRegister: false
    };
  }

  openSignInDialog() {
    this.setState({openSignIn: true});
  }

  closeSignInDialog() {
    this.setState({openSignIn: false});
  }

  openRegisterDialog() {
    this.setState({openRegister: true});
  }

  closeRegisterDialog() {
    this.setState({openRegister: false});
  }

  processLogin() {
    $.ajax({
      url: '/csrfToken',
      dataType: 'json',
      success: function(data) {
        $.post('/auth/login', {
          contact: this.refs.login.getValue(),
          password: this.refs.password.getValue(),
          _csrf: data._csrf
        }, this.loginSuccess.bind(this), this.loginFail.bind(this));
      }.bind(this)
    });
  }

  loginFail() {
  }

  loginSuccess() {
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
      <Toolbar style={{backgroundColor: this.props.theme.palette.primary1Color}} className="gcAppBar">
        <FlexDiv>
          <FontIcon className="material-icons" style={{color: this.props.theme.palette.textIconColor}}>language</FontIcon>
          <LanguagePicker/>
        </FlexDiv>

        <div>
          <IconMenu iconButtonElement={
            <IconButton style={{'display': 'none'}} iconStyle={{color: this.props.theme.palette.textIconColor}} touch={true}>
              <MoreVertIcon />
            </IconButton>
          }>
            <MenuItem primaryText="Sign In" onTouchTap={this.openSignInDialog.bind(this)}/>
            <MenuItem primaryText="Register" onTouchTap={this.openRegisterDialog.bind(this)}/>
          </IconMenu>
        </div>
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

GrottoAppBar.propTypes = {
  theme: PropTypes.object.isRequired
};

export default withTheme()(GrottoAppBar);
