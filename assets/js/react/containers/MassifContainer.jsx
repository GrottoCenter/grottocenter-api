import { connect } from 'react-redux';
import { loadMassif } from '../actions/Massif';
import { setPageTitle } from '../actions/PageTitle';
import MassifComponent from '../components/appli/Massif';

// =====

const updatePageTitle = (newPageTitle) => (dispatch) => {
  dispatch(setPageTitle(newPageTitle));
};


const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadMassif(props.match.params.massifId)),
  updatePageTitle: (newPageTitle) => dispatch(updatePageTitle(newPageTitle)),
});

const mapStateToProps = (state) => ({
  isFetching: state.massif.isFetching,
  massif: state.massif.massif,
});

export default connect(mapStateToProps, mapDispatchToProps)(MassifComponent);
