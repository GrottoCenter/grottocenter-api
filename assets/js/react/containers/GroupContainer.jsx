import { connect } from 'react-redux';
import { loadGroup } from '../actions/Group';
import Group from '../components/appli/Group';
import { setPageTitle } from '../actions/PageTitle';

// =====

const updatePageTitle = (newPageTitle) => (dispatch) => {
  dispatch(setPageTitle(newPageTitle));
};

const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadGroup(props.match.params.groupId)),
  updatePageTitle: (newPageTitle) => dispatch(updatePageTitle(newPageTitle)),
});

const mapStateToProps = (state) => ({
  isFetching: state.group.isFetching,
  group: state.group.group,
});

export default connect(mapStateToProps, mapDispatchToProps)(Group);
