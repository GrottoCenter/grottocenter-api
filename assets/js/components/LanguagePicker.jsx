import React, {Component} from 'react';
import {connect} from 'react-redux';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import muiThemeable from 'material-ui/styles/muiThemeable';

let languages = [// to this.state ?
];

class LanguagePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: locale // eslint-disable-line no-undef
    };

    languages = locales_list.map(function(el, index) {
      return <MenuItem key={index} value={el.value} primaryText={el.primaryText} />;
    });
  }

  handleChange(event, index, value) {
    if (value === this.state.value) {
      return;
    }
    window.location = '/?lang=' + value;
  }

  render() {
    return (
      <SelectField
        style={{width: 'initial'}}
        menuItemStyle={{color: this.props.muiTheme.grottoAppBar.textColor}}
        labelStyle={{paddingLeft: '10px', color: this.props.muiTheme.grottoAppBar.textColor}}
        value={this.state.value}
        onChange={this.handleChange.bind(this)}
      >
        {languages}
      </SelectField>
    );
  }
}

LanguagePicker = connect()(LanguagePicker);

export default muiThemeable()(LanguagePicker);
