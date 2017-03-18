import {CHANGE_LANGUAGE} from './../actions/Language';
import {DEFAULT_LANGUAGE} from '../Config';

// State
// =====
//   ???

export const currentLanguage = (state = {lang: DEFAULT_LANGUAGE}, action) => {
  switch (action.type) {
    case CHANGE_LANGUAGE:
      return action.lang;

    default:
      return state;
  }
};
