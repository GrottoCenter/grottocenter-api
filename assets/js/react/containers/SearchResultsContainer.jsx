import { connect } from 'react-redux';
import { resetAdvancedSearchResults } from '../actions/Advancedsearch';
import SearchResultsTable from '../components/homepage/advancedSearch/SearchResultsTable';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const resetAdvancedSearch = () => (dispatch) => {
  dispatch(resetAdvancedSearchResults());
};

const mapDispatchToProps = dispatch => ({
  resetAdvancedSearch: () => dispatch(
    resetAdvancedSearch(),
  ),
});

const mapStateToProps = state => ({
  isLoading: state.advancedsearch.isLoading,
  results: state.advancedsearch.results,
  resourceType: state.advancedsearch.searchCriterias.resourceType,
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsTable);
