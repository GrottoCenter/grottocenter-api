import {
  SET_PAGE_TITLE,
} from '../actions/PageTitle';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  pageTitle: '',
};

//
//
// R E D U C E R
//
//

const pageTitle = (state = initialState, action) => {
  switch (action.type) {
    case SET_PAGE_TITLE: {
      return {
        ...state,
        pageTitle: action.pageTitle,
      };
    }
    default:
      return state;
  }
};

export default pageTitle;
