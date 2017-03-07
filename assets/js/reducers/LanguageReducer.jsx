import {CHANGE_LANGUAGE} from './../actions/Language';

let defaultLanguageState = {
  lang: 'fr'
};

export const currentLanguage = (state = defaultLanguageState, action) => {
  switch (action.type) {
    case CHANGE_LANGUAGE:
      return action.lang;
    default:
      return state
  }
}
