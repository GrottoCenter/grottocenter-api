import fetch,  {Headers} from 'isomorphic-fetch';

export const INIT_LBNEW_FETCHER = 'INIT_LBNEWS_FETCHER';
export const FETCH_LBNEWS = 'FETCH_LBNEWS';
export const FETCH_LBNEWS_SUCCESS = 'FETCH_LBNEWS_SUCCESS';
export const FETCH_LBNEWS_FAILURE = 'FETCH_LBNEWS_FAILURE';
export const LOAD_LAST_BLOGNEWS = 'LOAD_LAST_BLOGNEWS';

export const initLastBlogNewsFetcher = (blog, url) => {
  return {
    type: INIT_LBNEW_FETCHER,
    blog: blog,
    url: url
  };
};

export const fetchLastBlogNews = (blog) => {
  return {
    type: FETCH_LBNEWS,
    blog: blog
  };
};

export const fetchLastBlogNewsSuccess = (blog, news) => {
  return {
    type: FETCH_LBNEWS_SUCCESS,
    blog: blog,
    news: news
  };
};

export const fetchLastBlogNewsFailure = (blog, error) => {
  return {
    type: FETCH_LBNEWS_FAILURE,
    blog: blog,
    error: error
  };
};

export function loadLastBlogNews(blog, url) {
  return function (dispatch) {
    dispatch(initLastBlogNewsFetcher(blog, url));
    dispatch(fetchLastBlogNews(blog));

    let header = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'X-Requested-With'
    });

    return fetch(url, {
      headers: header
    })
    .then((response) => {
      console.log('response.status',response.status);
      if (response.status >= 400) {
        throw new Error('Bad response from server'); // TODO Add better error management
      }
      return response.text();
    })
    .then(text => dispatch(fetchLastBlogNewsSuccess(blog, text)))
    .catch(error => {
      console.log('response.error',error);
      dispatch(fetchLastBlogNewsFailure(blog, error));
    });
  };
}
