import React from 'react';
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

class ProposalEntry extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var rows = [];
        var _this = this;
        this.props.data.forEach(function(item) {
          var linkToItem = _this.props.baseUrl + "/" + item.id;
          rows.push(
            <dd key={item.id}>
              <a href={linkToItem}>{item.name}</a>
            </dd>
          );
        });

        return (
            <dl>
              <dt>{this.props.title}</dt>
              {rows}
            </dl>
        );
    }
}

export default class SearchBar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {showProposal: false, caveResult: "", entryResult: ""};

  }
  displaySelection() {

    if (this.refs.quickSearchInput.getValue().length >= 3) {
      // Make requests to cave, entry, file, author, comments, forum
      $.ajax({
        url: "/cave/findAll?name=" + this.refs.quickSearchInput.getValue(),
        dataType: 'json',
        success: function(data) {
          this.setState({showProposal: true, caveResult: data});
        }.bind(this)
      });

      $.ajax({
        url: "/entry/findAll?name=" + this.refs.quickSearchInput.getValue(),
        dataType: 'json',
        success: function(data) {
          this.setState({showProposal: true, entryResult: data});
        }.bind(this)
      });

    } else {
      this.setState({showProposal: false, caveResult: "", entryResult: ""});
    }
  }
  render() {
    var proposal = [];

    if (this.state.caveResult.length > 0) {
      proposal.push(<ProposalEntry key="caves" title="Cave" baseUrl="/ui/cavedetail/" data={this.state.caveResult}/>);
    }
    if (this.state.entryResult.length > 0) {
      proposal.push(<ProposalEntry key="entries" title="Entry" baseUrl="/ui/entrydetail/" data={this.state.entryResult}/>);
    }

    var display = "none";
    if (proposal.length > 0) {
      display = "inline";
    }

    return (
        <MuiThemeProvider muiTheme={muiTheme}>
            <div>
            <TextField
                ref="quickSearchInput"
                hintText="Quick search"
                onChange={this.displaySelection.bind(this)}
            />
            <div style={{
              display: display
            }} className="proposal">{proposal}</div>
            </div>
        </MuiThemeProvider>
    );
  }
}
