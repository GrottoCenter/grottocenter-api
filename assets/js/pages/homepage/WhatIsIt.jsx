import React from 'react';
import I18n from 'react-ghost-i18n';

const WhatIsIt = () => (
  <div>
    <div role="section" className="">
      <h3  style={{'text-align': 'center', 'padding-bottom': '50px'}}>
        <I18n>At the beginning of 2017, Grottocenter represents:</I18n>
      </h3>
      <div className="container">
        <div className="row">
          <div style={{'text-align': 'center', 'padding-top': '20px'}} className="three columns">
            <div className="animData">16</div>
            <div style={{'padding-top': '20px'}}>
              <I18n>organizations who take part in the project by  funding, providing data,communicating on the interest and benefits of  cavers to share data.</I18n>
            </div>
          </div>
          <div style={{'text-align': 'center', 'padding-top': '20px'}} className="three columns">
            <div className="animData">654</div>
            <div style={{'padding-top': '20px'}}>
              <I18n>organizations are registered on the site</I18n>
            </div>
          </div>
          <div style={{'text-align': 'center', 'padding-top': '20px'}} className="three columns">
            <div className="animData">2724</div>
            <div style={{'padding-top': '20px'}}>
              <I18n>cavers take part, day after day, in improving and expanding the database</I18n>
            </div>
          </div>
          <div style={{'text-align': 'center', 'padding-top': '20px'}} className="three columns">
            <div className="animData">39175</div>
            <div style={{'padding-top': '20px'}}>
              <I18n>caves are freely accessible from the following page (</I18n>50 902 <I18n>by logging on</I18n> <a href='http://www.grottocenter.org'>Grotto v2</a>)

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default WhatIsIt;
