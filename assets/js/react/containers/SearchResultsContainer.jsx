import { connect } from 'react-redux';
import { fetchAdvancedsearchResult, resetAdvancedSearchResults } from '../actions/Advancedsearch';
import SearchResultsTable from '../components/homepage/advancedSearch/SearchResultsTable';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const startAdvancedsearch = (criterias, from, size) => (dispatch) => {
  const paramsToSend = {
    ...criterias,
    from,
    size,
  };
  dispatch(fetchAdvancedsearchResult(paramsToSend));
};

const resetAdvancedSearch = () => (dispatch) => {
  dispatch(resetAdvancedSearchResults());
};

const mapDispatchToProps = dispatch => ({
  startAdvancedsearch: (formValues, resourceType, from, size) => dispatch(
    startAdvancedsearch(formValues, resourceType, from, size),
  ),
  resetAdvancedSearch: () => dispatch(
    resetAdvancedSearch(),
  ),
});

const mapStateToProps = state => ({
  currentSearchCriterias: state.advancedsearch.searchCriterias,
  isLoading: state.advancedsearch.isLoading,
  results: state.advancedsearch.results,
  resourceType: state.advancedsearch.searchCriterias.resourceType,
  totalNbResults: state.advancedsearch.totalNbResults,
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsTable);
