import React, { Component } from 'react';
import IconButton from '@material-ui/core/IconButton';
import TranslateIcon from '@material-ui/icons/Translate';
import MapIcon from '@material-ui/icons/Map';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FlatButton from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Dialog from '@material-ui/core/Dialog';
import { withStyles } from '@material-ui/core/styles';
import styled from 'styled-components';
import LanguagePicker from '../../containers/LanguagePicker';
import SigninForm from '../SigninForm';
import Translate from './Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledToolbar = withStyles(theme => ({
  root: {
    width: 'auto',
    backgroundColor: theme.palette.primary1Color,
    zIndex: '100',
    minHeight: '56px',
    display: 'flex',
    justifyContent: 'space-between',
  },
}), { withTheme: true })(Toolbar);

const StyledTranslateIcon = withStyles(theme => ({
  root: {
    color: theme.palette.textIconColor,
  },
}), { withTheme: true })(TranslateIcon);

const StyledMapIcon = withStyles(theme => ({
  root: {
    color: theme.palette.textIconColor,
  },
}), { withTheme: true })(MapIcon);

const StyledIconButton = withStyles(theme => ({
  root: {
    color: theme.palette.textIconColor,
  },
}), { withTheme: true })(IconButton);

const FlexDiv = styled.div`
  display: inline-flex;
`;

//
//
// M A I N - C O M P O N E N T
//
//

class GrottoAppBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userMenuEl: null,
      openSignIn: false,
      openRegister: false,
    };
  }

  handleClick = (event) => {
    this.setState({ userMenuEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ userMenuEl: null });
  };

  openSignInDialog() {
    this.handleClose();
    this.setState({ openSignIn: true });
  }

  closeSignInDialog() {
    this.setState({ openSignIn: false });
  }

  openRegisterDialog() {
    this.handleClose();
    this.setState({ openRegister: true });
  }

  closeRegisterDialog() {
    this.setState({ openRegister: false });
  }

  processLogin() {
    $.ajax({
      url: '/csrfToken',
      dataType: 'json',
      success: function (data) {
        $.post('/auth/login', {
          contact: this.refs.login.getValue(),
          password: this.refs.password.getValue(),
          _csrf: data._csrf,
        }, this.loginSuccess.bind(this), this.loginFail.bind(this));
      }.bind(this),
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
        primary
        onClick={() => this.closeSignInDialog()}
      />,
      <FlatButton
        label="Submit"
        primary
        keyboardFocused
        onClick={() => this.closeSignInDialog()}
      />,
    ];

    const actionsRegister = [
      <FlatButton
        label="Cancel"
        primary
        onClick={() => this.closeRegisterDialog()}
      />,
      <FlatButton
        label="Submit"
        primary
        keyboardFocused
        onClick={() => this.closeRegisterDialog()}
      />,
    ];

    return (
      <StyledToolbar>

        <FlexDiv>
          <StyledTranslateIcon />
          <LanguagePicker />
        </FlexDiv>

        <FlexDiv>
          <a href="/ui/map">
            <StyledMapIcon />
          </a>
          <a href="/ui/map" style={{ color: 'white', textDecoration: 'none' }}>
            <Translate>Map</Translate>
          </a>
        </FlexDiv>

        <div style={{display: 'none'}}>
          <StyledIconButton onClick={this.handleClick}>
            <MoreVertIcon />
          </StyledIconButton>
          <Menu
            id="user-menu"
            anchorEl={this.state.userMenuEl}
            open={Boolean(this.state.userMenuEl)}
            onClose={this.handleClose}
          >
            <MenuItem onClick={() => this.openSignInDialog()}><Translate id="Sign In" /></MenuItem>
            <MenuItem onClick={() => this.openRegisterDialog()}><Translate id="Register" /></MenuItem>
          </Menu>
        </div>

        <Dialog
          title="SignIn Form"
          actions={actionsSignIn}
          modal={false}
          open={this.state.openSignIn}
          onRequestClose={() => this.closeSignInDialog()}
          onBackdropClick={() => this.closeSignInDialog()}
          onEscapeKeyDown={() => this.closeSignInDialog()}
          autoScrollBodyContent
        >
          <SigninForm />
        </Dialog>
        <Dialog
          title="Register Form"
          actions={actionsRegister}
          modal={false}
          open={this.state.openRegister}
          onRequestClose={() => this.closeRegisterDialog()}
          onBackdropClick={() => this.closeRegisterDialog()}
          onEscapeKeyDown={() => this.closeRegisterDialog()}
        >
          TODO: register form
        </Dialog>
      </StyledToolbar>
    );
  }
}

export default GrottoAppBar;
