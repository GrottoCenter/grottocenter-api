import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { postLogin } from '../actions/Auth';
import Login from '../components/common/login';

// =====

class LoginContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { contactEmail: '', password: '' };
  }

  onUsernameChange = (event) => {
    this.setState({ contactEmail: event.target.value });
  };

  onPasswordChange = (event) => {
    this.setState({ password: event.target.value });
  };

  onLogin = () => {
    const { contactEmail, password } = this.state;
    const { onLogin } = this.props;
    onLogin(contactEmail, password);
  };

  render() {
    return (
      <Login
        onUsernameChange={this.onUsernameChange}
        onPasswordChange={this.onPasswordChange}
        onLogin={this.onLogin}
      />
    );
  }
}

LoginContainer.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch) => ({
  onLogin: (contactEmail, password) =>
    dispatch(postLogin(contactEmail, password)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginContainer);
