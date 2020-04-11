import {
  FETCH_SUBTHEMES,
  FETCH_SUBTHEMES_FAILURE,
  FETCH_SUBTHEMES_SUCCESS,
} from '../actions/Subtheme';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  subthemes: [],
  themes: [],
  isFetching: false,
  errors: undefined,
};

//
//
// R E D U C E R
//
//
const subtheme = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SUBTHEMES:
      return Object.assign({}, state, {
        isFetching: true,
      });

    case FETCH_SUBTHEMES_SUCCESS:
      const subthemes = action.subthemes.map((st) => {
        return { id: st.id, name: st.name };
      });

      // The id of the theme is the first number before the first dot (ex: 1.1 - subthemeNumberOneTwo)
      const themes = action.subthemes.map((st) => {
        return { id: st.id.split('.')[0], name: st.theme };
      });

      let themesWithoutDuplicates = [];
      let previousThemeId = -1;
      // Remove duplicates
      for (const theme of themes) {
        if (theme.id != previousThemeId) {
          previousThemeId = theme.id;
          themesWithoutDuplicates.push(theme);
        }
      }

      return Object.assign({}, state, {
        subthemes,
        themes: themesWithoutDuplicates,
        isFetching: false,
      });

    case FETCH_SUBTHEMES_FAILURE:
      return Object.assign({}, state, {
        error: action.error,
        isFetching: false,
      });

    default:
      return state;
  }
};

export default subtheme;
