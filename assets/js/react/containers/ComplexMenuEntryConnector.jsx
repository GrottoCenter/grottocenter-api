import {connect} from 'react-redux';
import ComplexMenuEntry from '../components/appli/ComplexMenuEntry';
import {registerMenuEntry, toggleMenuEntry} from '../actions/SideMenu';

const mapDispatchToProps = (dispatch) => {
  return {
    register: (identifier, open) => dispatch(registerMenuEntry(identifier, open)),
    toggle: (identifier) => dispatch(toggleMenuEntry(identifier))
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
