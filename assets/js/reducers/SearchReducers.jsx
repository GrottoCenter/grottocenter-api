import {combineReducers} from "redux";

//import actions !!!
// import { ADD_TODO, TOGGLE_TODO, SET_VISIBILITY_FILTER, VisibilityFilters } from './actions'
// const { SHOW_ALL } = VisibilityFilters

const caves = (state = [], action) => {
  switch (action.type) {
    case 'START_SEARCH':
      return [];
    case 'LOAD_CAVE_SUCCESS':
      return action.data;
    default:
      return state
  }
}
const entries = (state = [], action) => {
  switch (action.type) {
    case 'START_SEARCH':
      return [];
    case 'LOAD_ENTRY_SUCCESS':
      return action.data;
    default:
      return state
  }
}

export const searchReducers = combineReducers({
  caves,
  entries
});
export default searchReducers;
