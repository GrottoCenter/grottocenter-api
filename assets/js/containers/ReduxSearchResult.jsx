import React from 'react'

class ReduxSearchResult extends React.Component {
  render() {
      var linkToItem = this.props.baseUrl + "/" + this.props.id;
      return (
      <dd key={this.props.id}>
        <a href={linkToItem}>{this.props.name}</a>
      </dd>
    )
  }
}
export default ReduxSearchResult
