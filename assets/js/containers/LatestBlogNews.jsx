import {connect} from 'react-redux';
import NewsCard from './../components/NewsCard';

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  let attributes = state.latestBlogNews[ownProps.blog];

  if (attributes === undefined) {
    return {
      showSpinner: true
    };
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
  mapStateToProps
)(NewsCard);

export default LatestBlogNews;
