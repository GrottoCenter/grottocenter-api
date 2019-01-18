import { connect } from 'react-redux';
import { fetchAdvancedsearchResult, resetAdvancedSearchResults } from '../actions/Advancedsearch';
import AdvancedSearch from '../components/homepage/advancedSearch/AdvancedSearch';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const startAdvancedsearch = (formValues, resourceType) => (dispatch) => {
  // complete is set to false because
  // we don't need the complete results about the data (we just want their name)
  // resourceType is set to "entries", "grottos" or "massifs" according to the search wanted
  const paramsToSend = {
    resourceType,
    complete: false,
  };

  Object.keys(formValues).forEach((key) => {
    let keyValue = formValues[key];

    // If String trim it
    if (typeof formValues[key] === 'string') {
      keyValue = formValues[key].trim();
    }

    // Handle range values
    if (keyValue !== '' && key.split('-range').length === 1) {
      paramsToSend[key] = keyValue;

      // If the key contains '-range' and it is editable
      // then we send the parameter in two parameters min and max
    } else if (key.split('-range').length > 1 && keyValue.isEditable === true) {
      const keyBase = key.split('-range');
      const rangeMin = `${keyBase[0]}-min`;
      const rangeMax = `${keyBase[0]}-max`;

      paramsToSend[rangeMin] = keyValue.min;
      paramsToSend[rangeMax] = keyValue.max;
    }
  });

  dispatch(fetchAdvancedsearchResult(paramsToSend));
};

const resetAdvancedSearch = () => (dispatch) => {
  dispatch(resetAdvancedSearchResults());
};

const mapDispatchToProps = dispatch => ({
  startAdvancedsearch: (formValues, resourceType) => dispatch(
    startAdvancedsearch(formValues, resourceType),
  ),
  resetAdvancedSearch: () => dispatch(
    resetAdvancedSearch(),
  ),
});

const mapStateToProps = state => ({
  isLoading: state.advancedsearch.isLoading,
  results: state.advancedsearch.results,
});

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch);
