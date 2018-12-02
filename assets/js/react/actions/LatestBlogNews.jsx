import fetch from 'isomorphic-fetch';

//
//
// A C T I O N S
//
//

export const INIT_LBNEW_FETCHER = 'INIT_LBNEWS_FETCHER';
export const FETCH_LBNEWS = 'FETCH_LBNEWS';
export const FETCH_LBNEWS_SUCCESS = 'FETCH_LBNEWS_SUCCESS';
export const FETCH_LBNEWS_FAILURE = 'FETCH_LBNEWS_FAILURE';
export const LOAD_LAST_BLOGNEWS = 'LOAD_LAST_BLOGNEWS';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const initLatestBlogNewsFetcher = (blog, url) => ({
  type: INIT_LBNEW_FETCHER,
  blog,
  url,
});

export const fetchLatestBlogNews = blog => ({
  type: FETCH_LBNEWS,
  blog,
});

export const fetchLatestBlogNewsSuccess = (blog, news) => ({
  type: FETCH_LBNEWS_SUCCESS,
  blog,
  news,
});

export const fetchLatestBlogNewsFailure = (blog, error) => ({
  type: FETCH_LBNEWS_FAILURE,
  blog,
  error,
});

//
//
// T H U N K S
//
//

export function loadLatestBlogNews(blog, url) {
  return function (dispatch) {
    dispatch(fetchLatestBlogNews(blog));

    return fetch(url)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error('Bad response from server'); // TODO Add better error management
        }
        return response.text();
      })
      .then(text => dispatch(fetchLatestBlogNewsSuccess(blog, text)))
      .catch((error) => {
        dispatch(fetchLatestBlogNewsFailure(blog, error));
      });
  };
}
