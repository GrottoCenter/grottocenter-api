import {connect} from 'react-redux';
import NewsCard from './../components/common/card/NewsCard';
import {initLatestBlogNewsFetcher, loadLatestBlogNews} from '../actions/LatestBlogNews';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    init: () => dispatch(initLatestBlogNewsFetcher(ownProps.blog, ownProps.url)),
    refresh: () => dispatch(loadLatestBlogNews(ownProps.blog, ownProps.url))
  };
};

const mapStateToProps = (state, ownProps) => {
  let attributes = state.latestBlogNews[ownProps.blog];

  if (attributes === undefined) {
    return {};
  }

  return {
    showSpinner: attributes.isFetching,
    day: attributes.news.day,
    month: attributes.news.month,
    title: attributes.news.title,
    text: attributes.news.text,
    linkMore: attributes.news.link
  };
};

const LatestBlogNews = connect(
  mapStateToProps,
  mapDispatchToProps
)(NewsCard);

export default LatestBlogNews;
