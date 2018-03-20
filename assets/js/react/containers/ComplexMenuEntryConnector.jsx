import {connect} from 'react-redux';
import ComplexMenuEntry from '../components/appli/ComplexMenuEntry';
import {registerMenuEntry, toggleMenuEntry, toggleSideMenu} from '../actions/SideMenu';

const mapDispatchToProps = (dispatch) => {
  return {
    register: (identifier, open, target) => dispatch(registerMenuEntry(identifier, open, target)),
    toggle: (identifier) => dispatch(toggleMenuEntry(identifier)),
    toggleSideMenu: () => dispatch(toggleSideMenu())
  };
};

const mapStateToProps = (state, ownProps) => {
  let currentItem;
  state.sideMenu.items.map((item) => {
    if (item.identifier === ownProps.identifier) {
      currentItem = item;
    }
  });
  return {
    open: (currentItem) ? currentItem.open : false,
  }
};

const ComplexMenuEntryConnector = connect(mapStateToProps, mapDispatchToProps)(ComplexMenuEntry);

export default ComplexMenuEntryConnector;
