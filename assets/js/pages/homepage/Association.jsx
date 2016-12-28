import React from 'react';
import I18n from 'react-ghost-i18n';

const Association = () => (
  <div>
    <div role="section" className="bgGradent association">
      <div className="container">
        <div className="row">
          <div className="eight columns">
            <h3>L'association Wikicaves</h3>
            <h5>
              <I18n>GrottoCenter is a comunity database for cavers based on a wiki-like system. Cavers fill the databes for cavers.</I18n>
              <br/>
              <I18n>Any interesting natural cave can be added in the database!</I18n>
            </h5>
          </div>
          <div className="four columns">
            <img src="/images/logo.svg"/>
          </div>
        </div>
        <div className="row">
          <div className="twelve columns">
            <p>
              <I18n>The international voluntary association WikiCaves operates the GrottoCenter web application. WikiCaves has as goals:</I18n>
              <ul>
                <li><I18n>Promote the development of the speleology in the world especially through  web-based collaboration.</I18n></li>
                <li><I18n>Share and spread the data related to the speleology.</I18n></li>
                <li><I18n>Make access to the natural caves data easier especially by using Internet.</I18n></li>
                <li><I18n>Highlight and help the protection of the natural caves and their surroundings.</I18n></li>
                <li><I18n>Help the exploration and the scientific study of natural caves.</I18n></li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Association;
