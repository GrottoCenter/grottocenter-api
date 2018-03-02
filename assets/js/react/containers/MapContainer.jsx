import {connect} from 'react-redux';
import {showMarker} from './../actions/Quicksearch';
import BackgroundMap from '../components/appli/Map';

const mapDispatchToProps = (dispatch, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    showMarker: (entry) => dispatch(showMarker(entry))
  };
}

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    marker: state.quicksearch.entry
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BackgroundMap);
