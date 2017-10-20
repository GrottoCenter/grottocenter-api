import React from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import I18n from 'react-ghost-i18n';
import LatestBlogNews from '../../containers/LatestBlogNews';
import {FR_GC_BLOG, EN_GC_BLOG} from '../../Config';

const LatestBlogNewsSection = () => (
  <div>
    <div role='section' className='lastNews'>
      <h3>
        <I18n>News</I18n>
      </h3>
      <div className='container'>
        <div className='row'>
          <div className='six columns'>
            <LatestBlogNews blog='fr' url={FR_GC_BLOG}/>
          </div>
          <div className='six columns'>
            <LatestBlogNews blog='en' url={EN_GC_BLOG}/>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default muiThemeable()(LatestBlogNewsSection);
