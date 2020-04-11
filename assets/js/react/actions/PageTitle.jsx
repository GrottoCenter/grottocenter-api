// ===== end imports

//
//
// A C T I O N S
//
//
export const SET_PAGE_TITLE = 'SET_PAGE_TITLE';
export const SET_PAGE_TITLE_TOOLTIP = 'SET_PAGE_TITLE_TOOLTIP';

export const setPageTitle = (pageTitle) => ({
  type: SET_PAGE_TITLE,
  pageTitle,
});

export const setPageTitleTooltip = (pageTitleTooltip) => ({
  type: SET_PAGE_TITLE_TOOLTIP,
  pageTitleTooltip,
});

//
//
// T H U N K S
//
//
