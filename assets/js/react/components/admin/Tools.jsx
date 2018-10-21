import React, {PropTypes, Component} from 'react';
import GCLink from '../common/GCLink';
import fetch from 'isomorphic-fetch';
import {Table, TableBody, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {Loading} from '../common/Toolbox';

const AvailableTools = () => (
  <ul>
    <li><GCLink internal={true} href="/admin/listEntriesOfInterest">Entries of interest</GCLink></li>
  </ul>
);

const EntriesOfInterestTableRow = (props) => (
  <TableRow>
    <TableRowColumn>{props.row.id}</TableRowColumn>
    <TableRowColumn>{props.row.name}</TableRowColumn>
    <TableRowColumn>{props.row.country}</TableRowColumn>
    <TableRowColumn>{props.row.region}</TableRowColumn>
    <TableRowColumn>{props.row.isPublic}</TableRowColumn>
    <TableRowColumn>{props.row.isSensitive}</TableRowColumn>
    <TableRowColumn>{props.row.isOfInterest.data[0]}</TableRowColumn>
    <TableRowColumn>{props.row.entryInfo && props.row.entryInfo.depth ? props.row.entryInfo.depth : ''}</TableRowColumn>
    <TableRowColumn>{props.row.entryInfo ? props.row.entryInfo.length: ''}</TableRowColumn>
    <TableRowColumn>{props.row.entryInfo ? <img style={{width: '150px'}} src={props.row.entryInfo.path}/> : ''}</TableRowColumn>
    <TableRowColumn>{props.row.stat ? props.row.stat.aestheticism : ''}</TableRowColumn>
    <TableRowColumn>{props.row.stat ? props.row.stat.caving : ''}</TableRowColumn>
    <TableRowColumn>{props.row.stat ? props.row.stat.approach : ''}</TableRowColumn>
    <TableRowColumn>{props.row.timeInfo ? props.row.timeInfo.eTTrail : ''}</TableRowColumn>
    <TableRowColumn>{props.row.timeInfo ? props.row.timeInfo.eTUnderground : ''}</TableRowColumn>
  </TableRow>
);

EntriesOfInterestTableRow.propTypes = {
  row: PropTypes.object.isRequired
}

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
    fetch('/api/admin/entry/findAllOfInterest')
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
    if (this.state.items.length == 0) {
      return <Loading />;
    }

    let rows = [];
    this.state.items.forEach(function(newRow) {
      console.log('newRow',newRow)
      if (newRow !== undefined) {
        rows.push(<EntriesOfInterestTableRow key={newRow.id} row={newRow}/>);
      }
    });

    return (
      <div>
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
                <TableHeaderColumn>Displayed image</TableHeaderColumn>
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
