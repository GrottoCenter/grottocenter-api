/**
 * TODO Add comment
 */

var SignupForm = React.createClass({
  getInitialState: function() {
    return {login: "", contact: "", password: "", repeatPassword: "", name: "", firstname: "", country: "", language: "", captchaControl: ""};
  },

  handleLogin: function(event) {
    this.setState({login: event.target.value});
  },

  handleContact: function(event) {
    this.setState({contact: event.target.value});
  },

  handlePassword: function(event) {
    this.setState({password: event.target.value});
  },

  handleRepeatPassword: function(event) {
    this.setState({repeatPassword: event.target.value});
  },

  handleName: function(event) {
    this.setState({name: event.target.value});
  },

  handleFirstname: function(event) {
    this.setState({firstname: event.target.value});
  },

  handleCountry: function(event) {
    this.setState({country: event.target.value});
  },

  handleLanguage: function(event) {
    this.setState({language: event.target.value});
  },

  handleCaptchaControl: function(event) {
    this.setState({captchaControl: event.target.value});
  },

  render: function() {
    return (
      <div style={{"padding": "50px 25%"}}>
        <BasicCard title="Sign up" image="news" text="Welcome to GC3!">
          <div className="loginForm">
            <div className="form-group">
              <label htmlFor="login"><I18n label="Login"/></label>
              <input className="form-control" type="text" name="login" id="login" placeholder="Login" value={this.state.login} onChange={this.handleLogin}/>
            </div>

            <div className="form-group">
              <label htmlFor="contact"><I18n label="Email"/></label>
              <input className="form-control" type="email" name="contact" id="contact" placeholder="Email" value={this.state.contact} onChange={this.handleContact}/>
            </div>

            <div className="form-group">
              <label htmlFor="password"><I18n label="Password"/></label>
              <input className="form-control" type="password" name="password" id="password" placeholder="Password" value={this.state.password} onChange={this.handlePassword}/>
            </div>

            <div className="form-group">
              <label htmlFor="repeatPassword"><I18n label="Repeat password"/></label>
              <input className="form-control" type="password" name="repeatPassword" id="repeatPassword" placeholder="Repeat password" value={this.state.repeatPassword} onChange={this.handleRepeatPassword}/>
            </div>

            <div className="form-group">
              <label htmlFor="name"><I18n label="Name"/></label>
              <input className="form-control" type="text" name="name" id="name" placeholder="Name" value={this.state.name} onChange={this.handleName}/>
            </div>

            <div className="form-group">
              <label htmlFor="firstname"><I18n label="Firstname"/></label>
              <input className="form-control" type="text" name="firstname" id="firstname" placeholder="Firstname" value={this.state.firstname} onChange={this.handleFirstname}/>
            </div>

            <div className="form-group">
              <label htmlFor="country"><I18n label="Country"/></label>
              <input className="form-control" type="text" name="country" id="country" placeholder="Country" value={this.state.country} onChange={this.handleCountry}/>
            </div>

            <div className="form-group">
              <label htmlFor="language"><I18n label="Language"/></label>
              <select className="form-control" name="language" id="language" onChange={this.handleLanguage}>
                <option>Language 1</option>
                <option>Language 2</option>
                <option>Language 3</option>
                <option>Language 4</option>
                <option>Language 5</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="captcha"><I18n label="Captcha"/></label>
              <img src=""/>
            </div>

            <div className="form-group">
              <label htmlFor="captchaControl"><I18n label="Captcha control"/></label>
              <input className="form-control" type="text" name="captchaControl" id="captchaControl" placeholder="Captcha control" value={this.state.captchaControl} onChange={this.handleCaptchaControl}/>
              <div>I can't read some characters	<a href="">Click here</a></div>
            </div>

            <div class="checkbox">
              <label>
                <input type="checkbox" value="" />
                Keep me informed of news by e-mail
              </label>
            </div>

            <div class="checkbox">
              <label>
                <input type="checkbox" value="" />
                I read and I accept the rules
              </label>
            </div>

            <button className="btn btn-default">Create my account</button>
          </div>
        </BasicCard>
      </div>
    );
  }
});
