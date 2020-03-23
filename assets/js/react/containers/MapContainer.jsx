import { connect } from 'react-redux';
import { fetchMapItemsResult, changeZoom, changeLocation } from '../actions/Map';
import GCMap from '../components/common/GCMap';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = (dispatch) => ({
  searchBounds: (criteria) => dispatch(fetchMapItemsResult(criteria)),
  setZoom: (zoom) => dispatch(changeZoom(zoom)),
  setLocation: (location) => dispatch(changeLocation(location)),
});

const mapStateToProps = (state) => ({
  mapCenter: state.map.location,
  mapZoom: state.map.zoom,
  selectedEntry: state.quicksearch.entry,
  entriesMap: state.map.entriesMap,
  isSideMenuOpen: state.sideMenu.open,
});

export default connect(mapStateToProps, mapDispatchToProps)(GCMap);
