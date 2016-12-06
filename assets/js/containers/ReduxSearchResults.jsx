import React from 'react'
import { connect } from 'react-redux'
import ReduxSearchResult from './ReduxSearchResult'

class ReduxSearchResultsClass extends React.Component {

  constructor(props) {
    super(props);
    // this.state = {
    //   open: false
    // };
  }

  render() {

    var display = "none";
    if (this.props.caves.length + this.props.entries.length > 0) {
      display = "inline";
    }
    return (
      <div style={{
              zIndex: 401,
              width: "inherit",
              display: display
        }} className="proposal">
        <dl>
          <dt>Cave</dt>
          {this.props.caves.map(cave =>
            <ReduxSearchResult
              key={cave.id}
              baseUrl="/ui/cavedetail/"
              {...cave}
            />
          )}
        </dl>
        <dl>
          <dt>Entry</dt>
          {this.props.entries.map(entry =>
            <ReduxSearchResult
              key={entry.id}
              baseUrl="/ui/entrydetail/"
              {...entry}
            />
          )}
        </dl>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    caves: state.caves,
    entries: state.entries
  }
}
const ReduxSearchResults = connect(
  mapStateToProps
)(ReduxSearchResultsClass)
export default ReduxSearchResults
