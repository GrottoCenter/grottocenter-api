import {connect} from 'react-redux';
import MenuBurger from '../components/appli/MenuBurger';
import {sideMenu} from '../actions/SideMenu';

const mapDispatchToProps = (dispatch) => {
  return {
    onclick: () => dispatch(sideMenu())
  }
};

const mapStateToProps = (state) => {
  return {
    visible: state.sideMenu.visible
  }
};

const MenuBurgerConnector = connect(mapStateToProps, mapDispatchToProps)(MenuBurger);

export default MenuBurgerConnector;
