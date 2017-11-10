import {connect} from 'react-redux';
import SimpleMenuEntry from '../components/appli/SimpleMenuEntry';
import {registerMenuEntry} from '../actions/SideMenu';

const mapDispatchToProps = (dispatch) => {
  return {
    register: (identifier, open) => dispatch(registerMenuEntry(identifier, open))
  };
};

const mapStateToProps = (state) => {
  return {
    visible: state.sideMenu.visible,
  }
};

const SimpleMenuEntryConnector = connect(mapStateToProps, mapDispatchToProps)(SimpleMenuEntry);

export default SimpleMenuEntryConnector;
