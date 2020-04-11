import { SET_PAGE_TITLE, SET_PAGE_TITLE_TOOLTIP } from '../actions/PageTitle';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  pageTitle: '',
  pageTitleTooltip: '',
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
    case SET_PAGE_TITLE_TOOLTIP: {
      return {
        ...state,
        pageTitleTooltip: action.pageTitleTooltip,
      };
    }
    default:
      return state;
  }
};

export default pageTitle;
