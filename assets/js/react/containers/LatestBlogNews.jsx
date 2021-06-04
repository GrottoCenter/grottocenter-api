import { connect } from 'react-redux';
import NewsCard from '../components/common/card/NewsCard';
import {
  initLatestBlogNewsFetcher,
  loadLatestBlogNews,
} from '../actions/LatestBlogNews';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(initLatestBlogNewsFetcher(ownProps.blog, ownProps.url)),
  refresh: () => dispatch(loadLatestBlogNews(ownProps.blog, ownProps.url)),
});

const mapStateToProps = (state, ownProps) => {
  const attributes = state.latestBlogNews[ownProps.blog];

  if (attributes === undefined) {
    return {};
  }

  return {
    showSpinner: attributes.isFetching,
    day: attributes.news.day,
    month: attributes.news.month,
    title: attributes.news.title,
    text: attributes.news.text,
    linkMore: attributes.news.link,
  };
};

const LatestBlogNews = connect(mapStateToProps, mapDispatchToProps)(NewsCard);

export default LatestBlogNews;
