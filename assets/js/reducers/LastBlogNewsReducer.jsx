import {INIT_LBNEW_FETCHER, FETCH_LBNEWS, FETCH_LBNEWS_SUCCESS, FETCH_LBNEWS_FAILURE} from './../actions/LastBlogNews';

// State
// =====
//   fr: {
//     url: '',
//     isFetching: false,
//     news: {
//       title: '',
//     },
//     revoked: false
//   },
//   en: {
//     url: '',
//     isFetching: false,
//     news: {},
//     revoked: false
//   }

export const lastBlogNews = (state = {}, action) => {
  switch (action.type) {
    case INIT_LBNEW_FETCHER:
      return Object.assign({}, state, {
        [action.blog]: {
          url: action.url,
          isFetching: false,
          news: '',
          revoked: true
        }
      });

    case FETCH_LBNEWS:
      return Object.assign({}, state, {
        [action.blog]: {
          isFetching: true,
          news: ''
        }
      });

    case FETCH_LBNEWS_SUCCESS:
      return Object.assign({}, state, {
        [action.blog]: {
          isFetching: false,
          news: action.news
        }
      });

    case FETCH_LBNEWS_FAILURE:
      return Object.assign({}, state, {
        [action.blog]: {
          isFetching: false,
          news: '',
          error: action.error
        }
      });

    default:
      return state;
  }
};
