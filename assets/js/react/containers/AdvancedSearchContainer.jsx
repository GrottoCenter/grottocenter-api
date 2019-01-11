import { connect } from 'react-redux';
import { fetchAdvancedsearchResult } from '../actions/Advancedsearch';
import AdvancedSearch from '../components/homepage/AdvancedSearch';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const startAdvancedsearch = (formValues, resourceType) => dispatch => new Promise((resolve) => {
  // complete is set to false because
  // we don't need the complete results about the data (we just want their name)
  // resourceType is set to "entries", "grottos" or "massifs" according to the search wanted
  const paramsToSend = {
    resourceType,
    complete: false,
  };

  Object.keys(formValues).forEach((key) => {
    if (formValues[key] !== '') {
      paramsToSend[key] = formValues[key];
    }
  });


  resolve(dispatch(fetchAdvancedsearchResult(paramsToSend)));
});

const mapDispatchToProps = dispatch => ({
  startAdvancedsearch: (formValues, resourceType) => dispatch(
    startAdvancedsearch(formValues, resourceType),
  ),
});

const mapStateToProps = state => ({
  results: state.advancedsearch.results,
});

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch);
