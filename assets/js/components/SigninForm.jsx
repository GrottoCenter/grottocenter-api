/**
 * TODO Add comment
 */
import React from 'react';

import BasicCard from './BasicCard';
import I18n from './I18n';

export default class SigninForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contact: '',
      password: ''
    };
  }

  handleContact(event) {
    this.setState({contact: event.target.value});
  }

  handlePassword(event) {
    this.setState({password: event.target.value});
  }

  render() {
    return (
      <div style={{'padding': '50px 25%'}}>
        <BasicCard title="Sign In" image="news" text="Welcome to GC3!">
          <div className="loginForm">
            <div className="form-group">
              <label htmlFor="contact"><I18n label="Email"/></label>
              <input className="form-control" type="email" name="contact" id="contact" placeholder="Email" value={this.state.contact} onChange={this.handleContact}/>
            </div>

            <div className="form-group">
              <label htmlFor="password"><I18n label="Password"/></label>
              <input className="form-control" type="password" name="password" id="password" placeholder="Password" value={this.state.password} onChange={this.handlePassword}/>
            </div>

            <button className="btn btn-default">Log in GC</button>
          </div>
        </BasicCard>
      </div>
    );
  }
}
