import { connect } from 'react-redux';
import { fetchAdvancedsearchResults, resetAdvancedSearchResults } from '../actions/Advancedsearch';
import { loadSubthemes } from '../actions/Subtheme';
import AdvancedSearch from '../components/homepage/advancedSearch/AdvancedSearch';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const startAdvancedsearch = (formValues, resourceType) => (dispatch) => {
  // complete is set to true because we need the complete results about the data
  // resourceType is set to "entries", "grottos" or "massifs" according to the search wanted
  const paramsToSend = {
    resourceType,
    complete: true,
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

  dispatch(fetchAdvancedsearchResults(paramsToSend));
};

const resetAdvancedSearch = () => (dispatch) => {
  dispatch(resetAdvancedSearchResults());
};

const getSubThemes = () => (dispatch) => {
  dispatch(loadSubthemes());
}

const mapDispatchToProps = dispatch => ({
  startAdvancedsearch: (formValues, resourceType) => dispatch(
    startAdvancedsearch(formValues, resourceType),
  ),
  resetAdvancedSearch: () => dispatch(
    resetAdvancedSearch(),
  ),
  getSubThemes: () => dispatch(
    getSubThemes(),
  ),
});

const mapStateToProps = (state) => ({
  themes: state.subtheme.themes,
  subthemes: state.subtheme.subthemes,
});

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch);
