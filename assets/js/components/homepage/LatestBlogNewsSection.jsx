import React, {PropTypes} from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import I18n from 'react-ghost-i18n';
import LatestBlogNews from '../../containers/LatestBlogNews';

const LatestBlogNewsSection = (props) => (
  <div>
    <div role="section" className="lastNews" style={{fontFamily: props.muiTheme.fontFamily}}>
      <h3>
        <I18n>News</I18n>
      </h3>
      <div className="container">
        <div className="row">
          <div className="six columns">
            <LatestBlogNews blog={'fr'}/>
          </div>
          <div className="six columns">
            <LatestBlogNews blog={'en'}/>
          </div>
        </div>
      </div>
    </div>
  </div>
);

LatestBlogNewsSection.propTypes = {
  muiTheme: PropTypes.object.isRequired
};

export default muiThemeable()(LatestBlogNewsSection);
