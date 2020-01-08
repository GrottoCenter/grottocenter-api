import React from 'react';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import IconButton from '@material-ui/core/IconButton';
import FilledInput from '@material-ui/core/FilledInput';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Translate from '../Translate';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const styles = {
  textField : {
    height: '45px',
    width: '90%',
    marginLeft: '5%',
    marginBottom: '5%'
  },

  input : {
    height: '45px',
    width: '90%',
    marginLeft: '5%',
    marginBottom: '5%'
  }
};

const BootstrapButton = withStyles({
  root: {
    backgroundColor: '#795548',
    height: '30px',
    boxShadow: 'none',
    textTransform: 'none',
    fontSize: 9,
    color: 'white',
    padding: '6px 12px',
    lineHeight: 1.5,
    marginLeft: '5%',
  },
})(Button);

const Link = withTheme()(styled.a`
  font-size: 70%;
  color: #795548;
  display: block;
  margin-top: 5%;
  margin-left: 5%;

  :hover {
    color: #795548;
    cursor: pointer;
    zoom: 1.2;
  }
`);

const LeftDivider = withStyles({
  root: {
    backgroundColor: '#795548',
    marginLeft: '5%', 
    float: 'left',
    width: '38%',
    height: '1.5px',
    marginTop: '11px'
  },
})(Divider);

const RightDivider = withStyles({
  root: {
    backgroundColor: '#795548',
    marginRight: '5%',
    float: 'right',
    width: '38%',
    height: '1.5px',
    marginTop: '11px'
  },
})(Divider);

const ConnectionIcon = withTheme()(styled.img`
  width: 8%;
  margin-left: 3%;
`);

const Icons = withTheme()(styled.div`
  display: inline-block;
  margin-top: 10%;
  margin-bottom: 5px;
`);

//
//
// M A I N - C O M P O N E N T
//
//

class ConnectionSection extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showPassword: false,
      password: '',
    };

    this.handleChange = this.handleChange.bind(this)
    this.handleClickShowPassword = this.handleClickShowPassword.bind(this)
    this.handleMouseDownPassword = this.handleMouseDownPassword.bind(this)
  }

  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };

  handleClickShowPassword = () => {
    this.setState({ showPassword: !this.state.showPassword });
  };

  handleMouseDownPassword = event => {
    event.preventDefault();
  };

  render() {
    return (
      <div>
        <Icons>
          <LeftDivider />
            <ConnectionIcon src="/images/sidemenu/user.png" alt="users icon" />
          <RightDivider />
        </Icons>

        <TextField
          id="filled-textarea"
          label="Username"
          multiline
          variant="filled"
          style = { styles.textField }
        />

        <FormControl variant="filled" style={ styles.input }>
          <InputLabel htmlFor="filled-adornment-password">Password</InputLabel>
          <FilledInput
            id="filled-adornment-password"
            type={this.state.showPassword ? 'text' : 'password'}
            value={this.state.password}
            onChange={this.handleChange('password')}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={this.handleClickShowPassword}
                  onMouseDown={this.handleMouseDownPassword}
                  edge="end"
                >
                  {this.state.showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>

        <BootstrapButton variant="contained" color="primary" disableRipple><Translate>LOG IN</Translate></BootstrapButton>

        <Link><Translate>Don't have an account ? Sign up here !</Translate></Link>
      </div>
    );
  }
}
  
export default ConnectionSection;