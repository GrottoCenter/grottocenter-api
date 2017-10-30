import {connect} from 'react-redux';
import {loadRandomEntry} from '../actions/RandomEntry';
import RandomEntryCard from '../components/common/card/RandomEntryCard';

const mapDispatchToProps = (dispatch, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    fetch: () => dispatch(loadRandomEntry())
  };
}

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    isFetching: state.randomEntry.isFetching,
    entry: state.randomEntry.entry
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RandomEntryCard);
