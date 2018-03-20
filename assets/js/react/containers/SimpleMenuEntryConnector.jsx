import {connect} from 'react-redux';
import SimpleMenuEntry from '../components/appli/SimpleMenuEntry';
import {registerMenuEntry, toggleSideMenu} from '../actions/SideMenu';

const mapDispatchToProps = (dispatch) => {
  return {
    register: (identifier, open, target) => dispatch(registerMenuEntry(identifier, open, target)),
    toggleSideMenu: () => dispatch(toggleSideMenu())
  };
};

const mapStateToProps = (state) => {
  return {
    visible: state.sideMenu.visible
  }
};

const SimpleMenuEntryConnector = connect(mapStateToProps, mapDispatchToProps)(SimpleMenuEntry);

export default SimpleMenuEntryConnector;
