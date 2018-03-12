import {connect} from 'react-redux';
import {fetchMapItemsResult, resetMapItems, changeZoom, changeLocation} from './../actions/Map';
import BackgroundMap from '../components/appli/BackgroundMap';

const mapDispatchToProps = (dispatch, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    resetMapItems: () => dispatch(resetMapItems()),
    searchBounds: (criteria) => dispatch(fetchMapItemsResult(criteria)),
    setZoom: (zoom) => dispatch(changeZoom(zoom)),
    setLocation: (location) => dispatch(changeLocation(location))
  };
}

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    selectedEntry: state.quicksearch.entry,
    visibleEntries: state.map.visibleEntries
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BackgroundMap);
