import React from 'react'
import { connect } from 'react-redux'
import ListOfResults from './ListOfResults'
import { startSearch, loadCaveSuccess, loadEntrySuccess } from './../../actions/Search'

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


    }
  }

  render() {
    return (
      <div>
        <TextField
          ref="quickSearchInput"
          inputStyle={{color: 'white'}}
          hintText="Rechercher une cavité, un club..."
          hintStyle={{color: 'white'}}
          fullWidth={true}
          onChange={this.displaySelection.bind(this)}
        />
        <ListOfResults />
      </div>
    );
  }
}

Bar = connect()(Bar);

export default muiThemeable()(Bar);
