import { connect } from 'react-redux';
import { loadBbs } from '../actions/Bbs';
import Bbs from '../components/appli/Bbs';

const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadBbs(props.match.params.bbsId)),
});

const mapStateToProps = state => ({
  isFetching: state.bbs.isFetching,
  bbs: state.bbs.bbs,
});

export default connect(mapStateToProps, mapDispatchToProps)(Bbs);
