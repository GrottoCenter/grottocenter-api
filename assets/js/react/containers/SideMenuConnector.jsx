import { connect } from 'react-redux';
import SideMenu from '../components/appli/SideMenu';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapStateToProps = (state) => ({
  visible: state.sideMenu.visible,
});

const SideMenuConnector = connect(mapStateToProps)(SideMenu);

export default SideMenuConnector;
