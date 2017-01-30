import React from 'react'
import { connect } from 'react-redux'
import ListOfResults from './ListOfResults'
import { startSearch, loadCaveSuccess, loadEntrySuccess, loadGrottoSuccess } from './../../actions/Search'

import TextField from 'material-ui/TextField';

import muiThemeable from 'material-ui/styles/muiThemeable';

class Bar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  displaySelection() {
    this.props.dispatch(startSearch(this.refs.quickSearchInput.value))

    if (this.refs.quickSearchInput.getValue().length >= 3) {
      $.ajax({
        url: '/cave/findAll?name=' + this.refs.quickSearchInput.getValue(),
        dataType: 'json',
        success: function(data) {
          this.props.dispatch(loadCaveSuccess(data))
        }.bind(this)
      });

      $.ajax({
        url: '/entry/findAll?name=' + this.refs.quickSearchInput.getValue(),
        dataType: 'json',
        success: function(data) {
          this.props.dispatch(loadEntrySuccess(data))
        }.bind(this)
      });

      $.ajax({
        url: "/grotto/findAll?name=" + this.refs.quickSearchInput.getValue(),
        dataType: 'json',
        success: function(data) {
            this.props.dispatch(loadGrottoSuccess(data))
        }.bind(this)
      });
    }
  }

  render() {
    return (
      <div>
        <TextField
          ref="quickSearchInput"
          inputStyle={{color: 'white'}}
          hintText={<I18n>Search for a cave or an organization</I18n>}
          hintStyle={{color: 'white'}}
          fullWidth={true}
          onChange={this.displaySelection.bind(this)}
        />
        <ListOfResults />
      </div>
    );
  }
}

Bar = connect()(Bar); // eslint-disable-line no-class-assign

export default muiThemeable()(Bar);
