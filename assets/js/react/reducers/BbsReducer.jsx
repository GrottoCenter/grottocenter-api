import { FETCH_BBS, FETCH_BBS_FAILURE, FETCH_BBS_SUCCESS } from '../actions/Bbs';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  bbs: undefined, // bbs fetched
  isFetching: false, // show loading spinner
  errors: undefined, // fetch errors
};

//
//
// R E D U C E R
//
//
const bbs = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BBS:
      return Object.assign({}, state, {
        bbs: action.bbs,
        isFetching: true,
      });
    case FETCH_BBS_SUCCESS:
      return Object.assign({}, state, {
        bbs: action.bbs,
        isFetching: false,
      });
    case FETCH_BBS_FAILURE:
      return Object.assign({}, state, {
        error: action.error,
        isFetching: false,
      });
    default:
      return state;
  }
};

export default bbs;
