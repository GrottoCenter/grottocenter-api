"use strict";

var SignToolbar = React.createClass({
  getInitialState: function() {
    return {showPopup: false, logged: false, csrf: ""};
  },

  componentWillMount: function() {
    this.fetchData({});
  },

  fetchData: function(filters) {
    $.ajax({
      url: "/csrfToken",
      dataType: 'json',
      success: function(data) {
        this.setState({csrf: data._csrf});
      }.bind(this)
    });
  },

  togglePopup: function() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  },

  processLogin: function(form) {
    console.log("form");
    console.log(form);
  },

  render: function() {
    var displayLoginPopupCss = "none";
    if (this.state.showPopup) {
      displayLoginPopupCss = "block";
    }

    if (this.state.logged) {
      return (
        <div>
          <span><I18n label="Welcome in"/>
            man!</span>
          <div className="button">
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
            <form method="post" onSubmit={this.processLogin}>
              <div className="form-group">
                <label htmlFor="contact"><I18n label="Email"/></label>
                <input className="form-control" type="email" name="contact" id="contact" placeholder="Email"/>
              </div>

              <div className="form-group">
                <label htmlFor="password"><I18n label="Password"/></label>
                <input className="form-control" type="password" name="password" id="password" placeholder="Password"/>
              </div>

              <input type="hidden" name="_csrf" value={this.state.csrf}/>

              <input className="btn btn-default" type="submit" value="Log in GC"/>
            </form>
          </div>
        </div>
      );
    }
  }
});
