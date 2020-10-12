import {
  CHANGE_LANGUAGE,
  FETCH_LANGUAGES,
  FETCH_LANGUAGES_FAILURE,
  FETCH_LANGUAGES_SUCCESS,
} from '../actions/Language';
import { DEFAULT_LANGUAGE } from '../conf/Config';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  lang: DEFAULT_LANGUAGE,
  languages: [],
  isFetching: false,
  errors: undefined,
};

//
//
// R E D U C E R
//
//

const language = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_LANGUAGE:
      return { ...state, lang: action.lang };

    case FETCH_LANGUAGES:
      return { ...state, isFetching: true };

    case FETCH_LANGUAGES_SUCCESS:
      return {
        ...state,
        languages: action.languages.sort((l1, l2) => l1.refName > l2.refName),
        isFetching: false,
      };

    case FETCH_LANGUAGES_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    default:
      return state;
  }
};

export default language;
