import { connect } from 'react-redux';
import { fetchNextAdvancedsearchResults, resetAdvancedSearchResults } from '../actions/Advancedsearch';
import SearchResultsTable from '../components/homepage/advancedSearch/SearchResultsTable';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const getNewResults = size => (dispatch) => {
  dispatch(fetchNextAdvancedsearchResults(size));
};

const resetAdvancedSearch = () => (dispatch) => {
  dispatch(resetAdvancedSearchResults());
};

const mapDispatchToProps = dispatch => ({
  getNewResults: size => dispatch(
    getNewResults(size),
  ),
  resetAdvancedSearch: () => dispatch(
    resetAdvancedSearch(),
  ),
});

const mapStateToProps = state => ({
  isLoading: state.advancedsearch.isLoading,
  results: state.advancedsearch.results,
  resourceType: state.advancedsearch.searchCriterias.resourceType,
  totalNbResults: state.advancedsearch.totalNbResults,
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsTable);
