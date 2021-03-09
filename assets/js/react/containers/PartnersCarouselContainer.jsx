import { connect } from 'react-redux';
import { loadPartnersForCarousel } from '../actions/PartnersForCarousel';
import PartnersCarousel from '../components/homepage/PartnersCarousel';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = (dispatch) => ({
  fetch: () => dispatch(loadPartnersForCarousel()),
});

const mapStateToProps = (state) => ({
  isFetching: state.partnersCarousel.isFetching,
  partners: state.partnersCarousel.partners,
});

export default connect(mapStateToProps, mapDispatchToProps)(PartnersCarousel);
