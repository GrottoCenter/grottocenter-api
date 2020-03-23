/**
 * TODO Add comment
 */
import React from 'react';
import Translate from './common/Translate';
import Modal from './common/Modal';

//
//
// M A I N - C O M P O N E N T
//
//

class SigninForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contact: '',
      password: '',
    };
  }

  handleContact(event) {
    this.setState({ contact: event.target.value });
  }

  handlePassword(event) {
    this.setState({ password: event.target.value });
  }

  render() {
    return (
      <Modal>
        <div className="loginForm">
          <div className="form-group">
            <label htmlFor="contact">
              <Translate id="Email" />
            </label>
            <input
              className="form-control"
              type="email"
              name="contact"
              id="contact"
              placeholder="Email"
              value={this.state.contact}
              onChange={this.handleContact}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <Translate id="Password" />
            </label>
            <input
              className="form-control"
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={this.state.password}
              onChange={this.handlePassword}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

export default SigninForm;
