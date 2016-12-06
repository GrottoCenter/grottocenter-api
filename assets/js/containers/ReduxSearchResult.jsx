import React from 'react'
import { connect } from 'react-redux'
import { showMarker } from './../actions/Search'

class ReduxSearchResult extends React.Component {

    isMappable(obj) {// TODO : move to models
        return obj.latitude && obj.longitude
    }
    clickResult(e) {
        if ( this.isMappable(this.props)) {
            this.props.dispatch(showMarker(this.props))
        }
    }
    render() {
        return (
        <dd key={this.props.id}>
            <a onClick={this.clickResult.bind(this)}>{this.props.name}</a>
        </dd>
        )
    }
}
ReduxSearchResult = connect()(ReduxSearchResult);
export default ReduxSearchResult
