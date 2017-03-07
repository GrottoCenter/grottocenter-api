import React, {Component, PropTypes} from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import muiThemeable from 'material-ui/styles/muiThemeable';
//import {changeLanguage} from '../actions/Language';

let languages = [// to this.state ?
];

class LanguageSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: locale // eslint-disable-line no-undef
    };

    languages = localesList.map(function(el, index) { // eslint-disable-line no-undef
      return <MenuItem key={index} value={el.value} primaryText={el.primaryText} style={{color: props.muiTheme.palette.primaryTextColor}} />;
    });
  }

  handleChange(event, index, value) {
    if (value === this.state.value) {
      return;
    }
    // To be uncommented when we will be able to retrieve catalog without page relaod
    // this.props.dispatch(changeLanguage(value));
    window.location = '/?lang=' + value;
  }

  render() {
    return (
      <SelectField
        labelStyle={{paddingLeft: '10px', color: this.props.muiTheme.palette.textIconColor}}
        value={this.state.value}
        onChange={this.handleChange.bind(this)}
        style={{minWidth: '150px', width: 'initial'}}
      >
        {languages}
      </SelectField>
    );
  }
}

LanguageSelector.propTypes = {
  dispatch: PropTypes.func.isRequired,
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(LanguageSelector);
