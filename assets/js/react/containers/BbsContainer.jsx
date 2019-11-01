import { connect } from 'react-redux';
import { loadBbs } from '../actions/Bbs';
import { setPageTitle } from '../actions/PageTitle';
import Bbs from '../components/appli/Bbs';

// =====

const updatePageTitle = (newPageTitle) => (dispatch) => {
  dispatch(setPageTitle(newPageTitle));
};

const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadBbs(props.match.params.bbsId)),
  updatePageTitle: (newPageTitle) => dispatch(updatePageTitle(newPageTitle)),
});

const mapStateToProps = (state) => ({
  isFetching: state.bbs.isFetching,
  bbs: state.bbs.bbs,
});

export default connect(mapStateToProps, mapDispatchToProps)(Bbs);
