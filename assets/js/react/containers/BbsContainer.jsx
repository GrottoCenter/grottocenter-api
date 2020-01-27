import { connect } from 'react-redux';
import { loadBbs } from '../actions/Bbs';
import { setPageTitle, setPageTitleTooltip } from '../actions/PageTitle';
import { Bbs } from '../components/appli/Bbs';

// =====

const updatePageTitle = (newPageTitle) => (dispatch) => {
  dispatch(setPageTitle(newPageTitle));
};

const updatePageTitleTooltip = (newPageTitleTooltip) => (dispatch) => {
  dispatch(setPageTitleTooltip(newPageTitleTooltip));
};

const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadBbs(props.match.params.bbsId)),
  updatePageTitle: (newPageTitle) => dispatch(updatePageTitle(newPageTitle)),
  updatePageTitleTooltip: (newPageTitleTooltip) => dispatch(updatePageTitleTooltip(newPageTitleTooltip)),
});

const mapStateToProps = (state) => ({
  isFetching: state.bbs.isFetching,
  bbs: state.bbs.bbs,
});

export default connect(mapStateToProps, mapDispatchToProps)(Bbs);
