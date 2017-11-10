import {connect} from 'react-redux';
import SideMenuBurger from '../components/appli/SideMenuBurger';
import {toggleSideMenu} from '../actions/SideMenu';

const mapDispatchToProps = (dispatch) => {
  return {
    onclick: () => dispatch(toggleSideMenu())
  }
};

const mapStateToProps = (state) => {
  return {
    visible: state.sideMenu.visible
  }
};

const SideMenuBurgerConnector = connect(mapStateToProps, mapDispatchToProps)(SideMenuBurger);

export default SideMenuBurgerConnector;
