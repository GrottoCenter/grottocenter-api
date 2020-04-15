import { connect } from 'react-redux';
import {
  fetchQuicksearchResult,
  resetQuicksearch,
  setCurrentEntry,
} from '../actions/Quicksearch';
import { focusOnLocation } from '../actions/Map';
import Searchbar from '../components/common/Searchbar';
import { isMappable } from '../helpers/Entity';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const startSearch = (keyword) => (dispatch) =>
  new Promise((resolve) => {
    if (keyword && keyword.trim().length >= 3) {
      // complete is set to false because
      // we don't need the complete results about the data (we just want their name)
      resolve(
        dispatch(
          fetchQuicksearchResult({
            query: keyword.trim(),
            complete: false,
          }),
        ),
      );
    } else {
      resolve(dispatch(resetQuicksearch()));
    }
  });

const handleSelection = (selection, ownProps) => (dispatch) => {
  // TODO case of array

  if (isMappable(selection[0].value)) {
    dispatch(setCurrentEntry(selection[0].value));
    dispatch(
      focusOnLocation({
        lat: selection[0].value.latitude,
        lng: selection[0].value.longitude,
      }),
    );
  }
  if (ownProps.handleSelection) {
    ownProps.handleSelection(selection[0].value);
  }
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  startSearch: (filter) => dispatch(startSearch(filter)),
  handleSelection: (selection) =>
    dispatch(handleSelection(selection, ownProps)),
});

const mapStateToProps = (state, ownProps) => ({
  results: state.quicksearch.results,
  selectedEntry: state.quicksearch.entry,
  classes: ownProps.classes,
});

export default connect(mapStateToProps, mapDispatchToProps)(Searchbar);
