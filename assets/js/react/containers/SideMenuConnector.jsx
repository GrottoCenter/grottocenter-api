import {connect} from 'react-redux';
import SideMenu from '../components/appli/SideMenu';

const mapStateToProps = (state) => {
  return {
    visible: state.sideMenu.visible
  }
};

const SideMenuConnector = connect(mapStateToProps)(SideMenu);

export default SideMenuConnector;
