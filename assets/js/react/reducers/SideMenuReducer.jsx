import {TOGGLE_SIDEMENU, REGISTER_MENU_ENTRY, TOGGLE_MENU_ENTRY} from '../actions/SideMenu';

// State
// =====
// sideMenu: {
//   visible: boolean,
//   items: [
//     {
//       identifier: string,
//       open: boolean
//     },
//     ...
//   ]
// }

const initial = {
  visible: false,
  items: []
};

export const sideMenu = (state = initial, action) => {
  switch (action.type) {
    case TOGGLE_SIDEMENU:
      return Object.assign({}, state, {
        visible: !state.visible
      });

    case REGISTER_MENU_ENTRY:
    {
      let alreadyRegistered = false;
      state.items.map((item) => {
        if (item.identifier === action.identifier) {
          alreadyRegistered = true;
        }
      });
      if (alreadyRegistered) {
        return Object.assign({}, state);
      }
      return Object.assign({}, state, {
        items: [
          ...state.items,
          {
            identifier: action.identifier,
            open: action.open
          }
        ]
      });
    }

    case TOGGLE_MENU_ENTRY:
      return Object.assign({}, state, {
        items: state.items.map((item) => {
          if (item.identifier === action.identifier) {
            return Object.assign({}, item, {
              open: !item.open
            });
          }
          return Object.assign({}, item, {
            open: false
          });
        })
      });

    default:
      return state;
  }
};
