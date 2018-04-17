import {connect} from 'react-redux';
import {loadRandomEntry} from '../actions/RandomEntry';
import RandomEntryCard from '../components/common/card/RandomEntryCard';

const mapDispatchToProps = (dispatch) => {
  return {
    fetch: () => dispatch(loadRandomEntry())
  };
}

const mapStateToProps = (state) => {
  return {
    isFetching: state.randomEntry.isFetching,
    entry: state.randomEntry.entry
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RandomEntryCard);
