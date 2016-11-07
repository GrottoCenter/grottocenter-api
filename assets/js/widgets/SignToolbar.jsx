"use strict";

var SignToolbar = React.createClass({
  getInitialState: function() {
    return {contact: "", password: "", showPopup: false, logged: false, nickname: ""};
  },

  togglePopup: function() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  },

  processLogin: function() {
    var _this = this;
    $.ajax({
      url: "/csrfToken",
      dataType: 'json',
      success: function(data) {
        $.post('/auth/login', {
          contact: this.state.contact,
          password: this.state.password,
          _csrf: data._csrf
        }, function(userData) {
          _this.setState({nickname: userData.user.nickname, logged: true, showPopup: false});
        });
      }.bind(this)
    });
  },

  handleContact: function(event) {
    this.setState({contact: event.target.value});
  },

  handlePassword: function(event) {
    this.setState({password: event.target.value});
  },

  render: function() {
    var displayLoginPopupCss = "none";
    if (this.state.showPopup) {
      displayLoginPopupCss = "block";
    }

    if (this.state.logged) {
      return (
        <div>
          <div className="button">
            <span className="hello-msg"><I18n label="Welcome in"/> {this.state.nickname}!</span>
            <a className="btn btn-success" href="#">
              <I18n label="Sign out"/>
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <div className="button">
            <a className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" href="/caver/new">
              <I18n label="Sign up"/>
              </a>
              <button className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" href="#" onClick={this.togglePopup}>
                <I18n label="Sign In"/>
                </button>
                <button className="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab">
  <i className="material-icons">mood</i>
</button>
            <a className="btn btn-success" href="/caver/new">
              <I18n label="Sign up"/>
            </a>
            <a className="btn btn-success" href="#" onClick={this.togglePopup}>
              <I18n label="Sign In"/>
            </a>
          </div>
          <div className="loginForm" style={{
            display: displayLoginPopupCss
          }}>
            <div className="form-group">
              <label htmlFor="contact"><I18n label="Email"/></label>
              <input className="form-control" type="email" name="contact" id="contact" placeholder="Email" value={this.state.contact} onChange={this.handleContact}/>
            </div>

            <div className="form-group">
              <label htmlFor="password"><I18n label="Password"/></label>
              <input className="form-control" type="password" name="password" id="password" placeholder="Password" value={this.state.password} onChange={this.handlePassword}/>
            </div>

            <input type="hidden" name="_csrf" value={this.state.csrf}/>

            <button className="btn btn-default" onClick={this.processLogin}>Log in GC</button>
          </div>
        </div>
      );
    }
  }
});
