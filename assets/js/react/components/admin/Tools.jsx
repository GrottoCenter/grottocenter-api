import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fetch from 'isomorphic-fetch';
import {
  Table,
  TableBody,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from '@material-ui/core';
import GCLink from '../common/GCLink';
import { Loading } from '../common/Toolbox';

//
//
// S U B - C O M P O N E N T S
//
//

const EntriesOfInterestTableRow = (props) => {
  const {
    row: {
      id,
      name,
      country,
      region,
      isPublic,
      isSensitive,
      isOfInterest,
      entryInfo,
      stats,
      timeInfo,
    },
  } = props;
  return (
    <TableRow>
      <TableRowColumn>{id}</TableRowColumn>
      <TableRowColumn>{name}</TableRowColumn>
      <TableRowColumn>{country}</TableRowColumn>
      <TableRowColumn>{region}</TableRowColumn>
      <TableRowColumn>{isPublic}</TableRowColumn>
      <TableRowColumn>{isSensitive}</TableRowColumn>
      <TableRowColumn>{isOfInterest.data[0]}</TableRowColumn>
      <TableRowColumn>
        {entryInfo && entryInfo.depth ? entryInfo.depth : ''}
      </TableRowColumn>
      <TableRowColumn>{entryInfo ? entryInfo.length : ''}</TableRowColumn>
      <TableRowColumn>
        {entryInfo ? (
          <img
            style={{ width: '150px' }}
            src={entryInfo.path}
            alt="Entry info"
          />
        ) : (
          ''
        )}
      </TableRowColumn>
      <TableRowColumn>{stats ? stats.aestheticism : ''}</TableRowColumn>
      <TableRowColumn>{stats ? stats.caving : ''}</TableRowColumn>
      <TableRowColumn>{stats ? stats.approach : ''}</TableRowColumn>
      <TableRowColumn>{timeInfo ? timeInfo.eTTrail : ''}</TableRowColumn>
      <TableRowColumn>{timeInfo ? timeInfo.eTUnderground : ''}</TableRowColumn>
    </TableRow>
  );
};

EntriesOfInterestTableRow.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    country: PropTypes.string,
    region: PropTypes.string,
    isPublic: PropTypes.bool,
    isSensitive: PropTypes.bool,
    isOfInterest: PropTypes.bool,
    entryInfo: PropTypes.shape({
      depth: PropTypes.string,
      length: PropTypes.number,
      path: PropTypes.number,
    }),
    stats: PropTypes.shape({
      aestheticism: PropTypes.number,
      caving: PropTypes.number,
      approach: PropTypes.number,
    }),
    timeInfo: PropTypes.shape({
      eTUnderground: PropTypes.number,
      eTTrail: PropTypes.number,
    }),
  }).isRequired,
};

export class EntriesOfInterest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    const _this = this; // eslint-disable-line no-underscore-dangle
    fetch('/api/admin/entrances/findAllOfInterest')
      .then((response) => {
        if (response.status >= 400) {
          throw new Error('Bad response from server');
        }
        return response.json();
      })
      .then((results) => {
        _this.setState({
          items: results,
        });
      });
  }

  render() {
    const { items } = this.state;
    if (items.length === 0) {
      return <Loading />;
    }

    const rows = [];
    items.forEach((newRow) => {
      if (newRow !== undefined) {
        rows.push(<EntriesOfInterestTableRow key={newRow.id} row={newRow} />);
      }
    });

    return (
      <div>
        {rows.length > 0 && (
          <Table
            selectable={false}
            multiSelectable={false}
            wrapperStyle={{ overflow: 'initial' }}
            bodyStyle={{ overflow: 'initial' }}
            style={{ width: 'initial' }}
          >
            <TableBody
              displayRowCheckbox={false}
              adjustForCheckbox={false}
              showRowHover
            >
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
        )}
      </div>
    );
  }
}

//
//
// M A I N - C O M P O N E N T
//
//

const AvailableTools = () => (
  <ul>
    <li>
      <GCLink internal href="/admin/listEntriesOfInterest">
        Entries of interest
      </GCLink>
    </li>
  </ul>
);

export default AvailableTools;
