import { isMobileOnly } from 'react-device-detect';
import { TOGGLE_SIDEMENU } from '../actions/SideMenu';

const initialState = {
  open: !isMobileOnly,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_SIDEMENU:
      return {
        ...state,
        open: !state.open,
      };

    default:
      return state;
  }
};

export default reducer;
