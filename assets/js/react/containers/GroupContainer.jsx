import { connect } from 'react-redux';
import { loadGroup } from '../actions/Group';
import Group from '../components/appli/Group';

const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadGroup(props.match.params.groupId)),
});

const mapStateToProps = state => ({
  isFetching: state.group.isFetching,
  group: state.group.group,
});

export default connect(mapStateToProps, mapDispatchToProps)(Group);
