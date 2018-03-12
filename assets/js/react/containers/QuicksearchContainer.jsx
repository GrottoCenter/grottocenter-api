import {connect} from 'react-redux';
import {fetchQuicksearchResult, resetQuicksearch, setCurrentEntry} from './../actions/Quicksearch';
import Searchbar from '../components/common/Searchbar';

const mapDispatchToProps = (dispatch, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    reset: () => dispatch(resetQuicksearch()),
    search: (criteria) => dispatch(fetchQuicksearchResult(criteria)),
    setCurrentEntry: (entry) => dispatch(setCurrentEntry(entry))
  };
}

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    results: state.quicksearch.results,
    selectedEntry: state.quicksearch.entry,
    className: ownProps.className
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Searchbar);
