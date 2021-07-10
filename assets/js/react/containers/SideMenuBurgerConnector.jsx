import { connect } from 'react-redux';
import SideMenuBurger from '../components/appli/SideMenuBurger';
import { toggleSideMenu } from '../actions/SideMenu';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = (dispatch) => ({
  onclick: () => dispatch(toggleSideMenu()),
});

const mapStateToProps = (state) => ({
  visible: state.sideMenu.visible,
});

const SideMenuBurgerConnector = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SideMenuBurger);

export default SideMenuBurgerConnector;
