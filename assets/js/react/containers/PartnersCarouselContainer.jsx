import {connect} from 'react-redux';
import {loadPartnersForCarousel} from './../actions/PartnersForCarousel';
import PartnersCarousel from './../components/homepage/PartnersCarousel';

const mapDispatchToProps = (dispatch, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    fetch: () => dispatch(loadPartnersForCarousel())
  };
}

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  return {
    isFetching: state.partnersCarousel.isFetching,
    partners: state.partnersCarousel.partners
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PartnersCarousel);
