import React from 'react'
import { connect } from 'react-redux'
import ListOfResults from './ListOfResults'
import { startSearch, loadCaveSuccess, loadEntrySuccess } from './../../actions/Search'

import TextField from 'material-ui/TextField';

import {cyan500} from 'material-ui/styles/colors';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

// This replaces the textColor value on the palette
// and then update the keys for each component that depends on it.
// More on Colors: http://www.material-ui.com/#/customization/colors
const muiTheme = getMuiTheme({
  palette: {
    textColor: cyan500,
  },
});

class Bar extends React.Component {

  constructor(props) {
    super(props);
    // this.state = {
    //   open: false
    // };
    // this.state = {showProposal: false, caveResult: "", entryResult: ""};

  }

  displaySelection() {
        this.props.dispatch(startSearch(this.refs.quickSearchInput.value))

        if (this.refs.quickSearchInput.getValue().length >= 3) {
                $.ajax({
                url: "/cave/findAll?name=" + this.refs.quickSearchInput.getValue(),
                dataType: 'json',
                success: function(data) {
                    this.props.dispatch(loadCaveSuccess(data))
                }.bind(this)
            });

            $.ajax({
                url: "/entry/findAll?name=" + this.refs.quickSearchInput.getValue(),
                dataType: 'json',
                success: function(data) {
                    this.props.dispatch(loadEntrySuccess(data))
                }.bind(this)
            });
        }
  }

  render() {
    return (
        <MuiThemeProvider muiTheme={muiTheme}>
            <div>
                <TextField
                    ref="quickSearchInput"
                    hintText="Quick search"
                    onChange={this.displaySelection.bind(this)}
                />
                <ListOfResults />
            </div>
        </MuiThemeProvider>
    )
  }
}
Bar = connect()(Bar);
export default Bar
