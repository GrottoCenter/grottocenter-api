import {TOGGLE_SIDEMENU} from '../actions/SideMenu';

// State
// =====
//   sideMenu.visible (true / false)

export const sideMenu = (state = {visible: false}, action) => {
  switch (action.type) {
    case TOGGLE_SIDEMENU:
      return Object.assign({}, state, {
        visible: !state.visible
      });

    default:
      return state;
  }
};
