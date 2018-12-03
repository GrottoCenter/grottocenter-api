import { connect } from 'react-redux';
import { loadMassif } from '../actions/Massif';
import Massif from '../components/appli/Massif';

const mapDispatchToProps = (dispatch, props) => ({
  fetch: dispatch(loadMassif(props.match.params.massifId)),
});

const mapStateToProps = state => ({
  isFetching: state.massif.isFetching,
  massif: state.massif.massif,
});

export default connect(mapStateToProps, mapDispatchToProps)(Massif);
