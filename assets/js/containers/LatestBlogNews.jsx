import {connect} from 'react-redux';
import NewsCard from './../components/NewsCard';

const mapStateToProps = (state, ownProps) => { // eslint-disable-line no-unused-vars
  let attributes = state.lastBlogNews[ownProps.blog];

  if (attributes === undefined) {
    return {
      showSpinner: true
    };
  }

  return {
    showSpinner: attributes.isFetching,
    image: attributes.image,
    day: attributes.day,
    month: attributes.month,
    title: attributes.title,
    text: attributes.news,
    linkMore: attributes.linkMore
  };
};

const LatestBlogNews = connect(
  mapStateToProps
)(NewsCard);

export default LatestBlogNews;
