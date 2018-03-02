import {connect} from 'react-redux';
import {fetchQuicksearchResult, resetQuicksearch, showMarker} from './../actions/Quicksearch';
import Autocomplete from '../components/common/Autocomplete';
import BackgroundMap from '../components/appli/Map';

const mapDispatchToProps = (dispatch, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    reset: () => dispatch(resetQuicksearch()),
    search: (criteria) => dispatch(fetchQuicksearchResult(criteria)),
    showMarker: (entry) => dispatch(showMarker(entry))
  };
}

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    results: state.quicksearch.results,
    marker: state.quicksearch.entry,
    className: ownProps.className
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Autocomplete, BackgroundMap);
