import { connect } from 'react-redux';
import { fetchNextAdvancedsearchResults, fetchFullAdvancedsearchResults, resetAdvancedSearchResults } from '../actions/Advancedsearch';
import SearchResultsTable from '../components/homepage/advancedSearch/SearchResultsTable';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//
const getNewResults = (from, size) => (dispatch) => {
  dispatch(fetchNextAdvancedsearchResults(from, size));
};

const getFullResults = () => (dispatch) => {
  dispatch(fetchFullAdvancedsearchResults());
}

const resetAdvancedSearch = () => (dispatch) => {
  dispatch(resetAdvancedSearchResults());
};

const mapDispatchToProps = dispatch => ({
  getNewResults: (from, size) => dispatch(
    getNewResults(from, size),
  ),
  fetchFullAdvancedsearchResults: () => dispatch(
    fetchFullAdvancedsearchResults(),
  ),
  resetAdvancedSearch: () => dispatch(
    resetAdvancedSearch(),
  ),
});

const mapStateToProps = state => ({
  isLoading: state.advancedsearch.isLoading,
  isLoadingFullData: state.advancedsearch.isLoadingFullData,
  wantToDownloadCSV: state.advancedsearch.wantToDownloadCSV,
  results: state.advancedsearch.results,
  resourceType: state.advancedsearch.searchCriterias.resourceType,
  totalNbResults: state.advancedsearch.totalNbResults,
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsTable);
