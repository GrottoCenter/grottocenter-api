import {connect} from 'react-redux';
import {loadPartnersForCarousel} from './../actions/PartnersForCarousel';
import PartnersCarousel from './../components/homepage/PartnersCarousel';

const mapDispatchToProps = (dispatch) => {
  return {
    fetch: () => dispatch(loadPartnersForCarousel())
  };
}

const mapStateToProps = (state) => {
  return {
    isFetching: state.partnersCarousel.isFetching,
    partners: state.partnersCarousel.partners
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PartnersCarousel);
