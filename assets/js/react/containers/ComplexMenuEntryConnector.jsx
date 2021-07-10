import { connect } from 'react-redux';
import ComplexMenuEntry from '../components/appli/ComplexMenuEntry';
import {
  // registerMenuEntry,
  // toggleMenuEntry,
  toggleSideMenu,
} from '../actions/SideMenu';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = (dispatch) => ({
  // register: (identifier, open, target) => dispatch(registerMenuEntry(identifier, open, target)),
  // toggle: (identifier) => dispatch(toggleMenuEntry(identifier)),
  toggleSideMenu: () => dispatch(toggleSideMenu()),
});

const mapStateToProps = (state, ownProps) => {
  for (let i = 0; i < state.sideMenu.items.length; i += 1) {
    const item = state.sideMenu.items[i];
    if (item.identifier === ownProps.identifier) {
      return item.open;
    }
  }
  return false;
};

const ComplexMenuEntryConnector = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ComplexMenuEntry);

export default ComplexMenuEntryConnector;
