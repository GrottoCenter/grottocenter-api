import React from 'react'
import { connect } from 'react-redux'
import { showMarker } from './../../actions/Search'

class Result extends React.Component {

    isMappable(obj) {// TODO : move to models
        return obj.latitude && obj.longitude
    }
    clickResult(e) {
        if ( this.isMappable(this.props)) {
            this.props.dispatch(showMarker(this.props))
        }
        if ( this.props.id)
          window.open('http://www.grottocenter.org/html/file_En.php?lang=En&check_lang_auto=false&category=entry&id='+this.props.id,'caveWindow');
    }
    render() {
        return (
        <dd key={this.props.id}>
            <a onClick={this.clickResult.bind(this)}>{this.props.name}</a>
        </dd>
        )
    }
}
Result = connect()(Result);
export default Result
