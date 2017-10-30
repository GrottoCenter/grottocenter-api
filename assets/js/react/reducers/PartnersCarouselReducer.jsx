import {FETCH_PARTNERS_FC, FETCH_PARTNERS_FC_SUCCESS, FETCH_PARTNERS_FC_FAILURE} from './../actions/PartnersForCarousel';

const initialState = {
  isFetching: false, // show loading spinner
  partners: undefined   // partners list
}

export const partnersCarousel = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PARTNERS_FC:
      return Object.assign({}, state, {
        isFetching: true
      });
    case FETCH_PARTNERS_FC_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        partners: action.entry
      });
    case FETCH_PARTNERS_FC_FAILURE:
      return Object.assign({}, state, {
        isFetching: false,
        error: action.error
      });
    default:
      return state;
  }
};
