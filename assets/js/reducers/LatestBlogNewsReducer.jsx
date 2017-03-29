import {INIT_LBNEW_FETCHER, FETCH_LBNEWS, FETCH_LBNEWS_SUCCESS, FETCH_LBNEWS_FAILURE} from './../actions/LatestBlogNews';

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

export const latestBlogNews = (state = {}, action) => {
  let jNews = '';
  switch (action.type) {
    case INIT_LBNEW_FETCHER:
      return Object.assign({}, state, {
        [action.blog]: {
          url: action.url,
          isFetching: false,
          news: {},
          revoked: true
        }
      });

    case FETCH_LBNEWS:
      return Object.assign({}, state, {
        [action.blog]: {
          isFetching: true,
          news: {}
        }
      });

    case FETCH_LBNEWS_SUCCESS:
      jNews = JSON.parse(action.news);
      return Object.assign({}, state, {
        [action.blog]: {
          isFetching: false,
          news: {
            title: jNews.title,
            link: jNews.link,
            text: jNews.text,
            day: jNews.day,
            month: jNews.month
          }
        }
      });

    case FETCH_LBNEWS_FAILURE:
      return Object.assign({}, state, {
        [action.blog]: {
          isFetching: false,
          news: {},
          error: action.error
        }
      });

    default:
      return state;
  }
};
