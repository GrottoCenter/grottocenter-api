import React, {Component} from 'react';
import GCLink from '../GCLink';
import fetch from 'isomorphic-fetch';
import {Table, TableBody, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {Loading} from '../Toolbox';

const AvailableTools = () => (
  <ul>
    <li><GCLink internal={true} href="/ui/admin/listEntriesOfInterest">Entries of interest</GCLink></li>
  </ul>
);

const EntriesOfInterestTableRow = (props) => (
  <TableRow>
    <TableRowColumn>{props.row[0].id}</TableRowColumn>
    <TableRowColumn>{props.row[0].name}</TableRowColumn>
    <TableRowColumn>{props.row[0].country}</TableRowColumn>
    <TableRowColumn>{props.row[0].region}</TableRowColumn>
    <TableRowColumn>{props.row[0].isPublic}</TableRowColumn>
    <TableRowColumn>{props.row[0].isSensitive}</TableRowColumn>
    <TableRowColumn>{props.row[0].isOfInterest[0]}</TableRowColumn>
    {props.row[0]['entryInfo'][0] !== undefined &&
      <TableRowColumn>{props.row[0]['entryInfo'][0].depth}</TableRowColumn>
    }
    {props.row[0]['entryInfo'][0] !== undefined &&
      <TableRowColumn>{props.row[0]['entryInfo'][0].length}</TableRowColumn>
    }
    {props.row[0]['entryInfo'][0] !== undefined &&
      <TableRowColumn><img style={{width: '150px'}} src={props.row[0]['entryInfo'][0].path}/></TableRowColumn>
    }
    {props.row[0]['entryInfo'][0] === undefined &&
      <TableRowColumn>not defined</TableRowColumn>
    }
    {props.row[0]['entryInfo'][0] === undefined &&
      <TableRowColumn>not defined</TableRowColumn>
    }
    {props.row[0]['entryInfo'][0] === undefined &&
      <TableRowColumn>not defined</TableRowColumn>
    }
    <TableRowColumn>{props.row[0]['stat'].aestheticism}</TableRowColumn>
    <TableRowColumn>{props.row[0]['stat'].caving}</TableRowColumn>
    <TableRowColumn>{props.row[0]['stat'].approach}</TableRowColumn>
    <TableRowColumn>{props.row[0]['timeInfo'].eTTrail}</TableRowColumn>
    <TableRowColumn>{props.row[0]['timeInfo'].eTUnderground}</TableRowColumn>
  </TableRow>
);

export class EntriesOfInterest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
    };
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    let _this = this;
    fetch('/admin/entry/findAllOfInterest')
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error('Bad response from server');
      }
      return response.json();
    }).then(function(results) {
      _this.setState({
        items: results
      });
    });
  }

  render() {
    let rows = [];
    if (this.state.items.length > 0) {
      this.state.items.forEach(function(newRow) {
        if (newRow !== undefined) {
          rows.push(<EntriesOfInterestTableRow key={newRow[0].id} row={newRow}/>);
        }
      });
    }

    return (
      <div>
        {rows.length === 0 &&
          <Loading/>
        }
        {rows.length > 0 &&
          <Table selectable={false} multiSelectable={false} wrapperStyle={{overflow: 'initial'}} bodyStyle={{overflow: 'initial'}} style={{width: 'initial'}}>
            <TableBody displayRowCheckbox={false} adjustForCheckbox={false} showRowHover={true}>
              <TableRow selectable={false}>
                <TableHeaderColumn>Id</TableHeaderColumn>
                <TableHeaderColumn>Name</TableHeaderColumn>
                <TableHeaderColumn>Country</TableHeaderColumn>
                <TableHeaderColumn>Region</TableHeaderColumn>
                <TableHeaderColumn>Is public</TableHeaderColumn>
                <TableHeaderColumn>Is sensitive</TableHeaderColumn>
                <TableHeaderColumn>Is of interest</TableHeaderColumn>
                <TableHeaderColumn>Depth</TableHeaderColumn>
                <TableHeaderColumn>Length</TableHeaderColumn>
                <TableHeaderColumn>Path</TableHeaderColumn>
                <TableHeaderColumn>Stat for aestheticism</TableHeaderColumn>
                <TableHeaderColumn>Stat for caving</TableHeaderColumn>
                <TableHeaderColumn>Stat for approach</TableHeaderColumn>
                <TableHeaderColumn>Time to go</TableHeaderColumn>
                <TableHeaderColumn>Underground time</TableHeaderColumn>
              </TableRow>
              {rows}
            </TableBody>
          </Table>
        }
      </div>
    );
  }
}

export default AvailableTools;
