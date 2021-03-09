import { connect } from 'react-redux';
import {
  fetchAdvancedsearchResults,
  resetAdvancedSearchResults,
} from '../actions/Advancedsearch';
import { loadSubjects } from '../actions/Subject';
import AdvancedSearch from '../components/homepage/advancedSearch/AdvancedSearch';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const startAdvancedsearch = (formValues, resourceType) => (dispatch) => {
  // complete is set to true because we need the complete results about the data
  // resourceType is set to "entrances", "grottos", "massifs" or "documents"
  // according to the search desired
  const paramsToSend = {
    complete: true,
    resourceType,
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

const getSubjects = () => (dispatch) => {
  dispatch(loadSubjects());
};

const mapDispatchToProps = (dispatch) => ({
  startAdvancedsearch: (formValues, resourceType) =>
    dispatch(startAdvancedsearch(formValues, resourceType)),
  resetAdvancedSearch: () => dispatch(resetAdvancedSearch()),
  getSubjects: () => dispatch(getSubjects()),
});

const mapStateToProps = (state) => ({
  subjects: state.subject.subjects,
});

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch);
