import {connect} from 'react-redux';
import {fetchMapItemsResult, changeZoom, changeLocation} from './../actions/Map';
import BackgroundMap from '../components/appli/BackgroundMap';

const mapDispatchToProps = (dispatch) => {
  return {
    searchBounds: (criteria) => dispatch(fetchMapItemsResult(criteria)),
    setZoom: (zoom) => dispatch(changeZoom(zoom)),
    setLocation: (location) => dispatch(changeLocation(location))
  };
}

const mapStateToProps = (state) => {
  return {
    selectedEntry: state.quicksearch.entry,
    visibleEntries: state.map.visibleEntries
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BackgroundMap);
