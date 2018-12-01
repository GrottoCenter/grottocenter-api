import { connect } from 'react-redux';
import { loadRandomEntry } from '../actions/RandomEntry';
import RandomEntryCard from '../components/common/card/RandomEntryCard';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = dispatch => ({
  fetch: () => dispatch(loadRandomEntry()),
});

const mapStateToProps = state => ({
  isFetching: state.randomEntry.isFetching,
  entry: state.randomEntry.entry,
});

export default connect(mapStateToProps, mapDispatchToProps)(RandomEntryCard);
