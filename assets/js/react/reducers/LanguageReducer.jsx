import {CHANGE_LANGUAGE} from './../actions/Language';
import {DEFAULT_LANGUAGE} from '../conf/Config';

//
//
// D E F A U L T - S T A T E
//
//

//
//
// R E D U C E R
//
//

export const currentLanguage = (state = {lang: DEFAULT_LANGUAGE}, action) => {
  switch (action.type) {
    case CHANGE_LANGUAGE:
      return action.lang;

    default:
      return state;
  }
};
